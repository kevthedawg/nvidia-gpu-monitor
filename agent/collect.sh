#!/bin/bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:?BACKEND_URL environment variable is required}"
INTERVAL="${INTERVAL:-5}"

if ! command -v nvidia-smi &>/dev/null; then
  echo "Error: nvidia-smi not found. Ensure NVIDIA drivers are installed and the GPU is passed through to this container." >&2
  exit 1
fi

if ! nvidia-smi &>/dev/null; then
  echo "Error: nvidia-smi failed. Ensure the GPU is accessible from this container." >&2
  exit 1
fi

echo "GPU agent started — polling every ${INTERVAL}s, sending to ${BACKEND_URL}"

while true; do
  gpu=$(nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,name \
    --format=csv,noheader,nounits)

  processes=$(nvidia-smi --query-compute-apps=gpu_uuid,pid,used_gpu_memory,process_name \
    --format=csv,noheader,nounits 2>/dev/null || true)

  gpu_uuids=$(nvidia-smi --query-gpu=index,uuid --format=csv,noheader,nounits)

  payload=$(jq -n --arg gpu "$gpu" --arg procs "$processes" --arg uuids "$gpu_uuids" '
    # Build index→uuid lookup
    ($uuids | split("\n") | map(select(length > 0)) | map(
      split(", ") | { index: .[0], uuid: .[1] }
    )) as $uuid_map |

    # Parse all GPUs
    ($gpu | split("\n") | map(select(length > 0)) | map(
      split(", ") | {
        gpuIndex:    (.[0] | tonumber),
        gpuUtil:     (.[1] | tonumber),
        memUsed:     (.[2] | tonumber),
        memTotal:    (.[3] | tonumber),
        temperature: (.[4] | tonumber),
        powerDraw:   (.[5] | tonumber),
        gpuName:     .[6]
      }
    )) as $gpus |

    # Parse all processes, map UUID back to index
    (
      if ($procs | ltrimstr(" ") | length) == 0 or ($procs | test("[Nn]o running|\\[N/A\\]"))
      then []
      else
        $procs | split("\n") | map(select(length > 0)) | map(
          split(", ") as $p |
          ($uuid_map | map(select(.uuid == $p[0])) | .[0].index // "0") as $idx |
          {
            gpuIndex:    ($idx | tonumber),
            pid:         ($p[1] | tonumber),
            usedMemory:  ($p[2] | tonumber),
            processName: $p[3]
          }
        )
      end
    ) as $processes |

    {
      gpus: $gpus,
      processes: $processes
    }')

  # Log payload for debugging (first iteration only)
  if [ -z "${_LOGGED:-}" ]; then
    echo "First payload: $payload"
    _LOGGED=1
  fi

  echo "$payload" | curl -s -X POST "${BACKEND_URL}/api/metrics" \
    -H "Content-Type: application/json" \
    -d @- -o /dev/null --max-time 5 || true

  sleep "$INTERVAL"
done
