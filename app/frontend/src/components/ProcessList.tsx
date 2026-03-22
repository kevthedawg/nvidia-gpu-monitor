import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

interface Process {
  gpuIndex: number;
  pid: number;
  processName: string;
  usedMemory: number;
}

const formatMemory = (mb: number): string => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${String(mb)} MB`;
};

export const ProcessList = ({
  processes,
}: {
  processes: Process[];
}): React.ReactElement => {
  if (processes.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ opacity: 0.6 }}>
            {"No GPU processes running"}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.6 }}>
          {"GPU Processes"}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{"GPU"}</TableCell>
              <TableCell>{"PID"}</TableCell>
              <TableCell>{"Process"}</TableCell>
              <TableCell align="right">{"VRAM"}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processes.map((p) => (
              <TableRow key={`${String(p.gpuIndex)}-${String(p.pid)}`}>
                <TableCell>{p.gpuIndex}</TableCell>
                <TableCell>{p.pid}</TableCell>
                <TableCell
                  sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                >
                  {p.processName}
                </TableCell>
                <TableCell align="right">
                  {formatMemory(p.usedMemory)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
