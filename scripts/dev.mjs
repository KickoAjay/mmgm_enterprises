import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT ?? "3000";

function getLanIpv4Addresses() {
  const addresses = new Set();
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const iface of interfaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.add(iface.address);
      }
    }
  }
  return [...addresses];
}

const lanIps = getLanIpv4Addresses();

console.log("");
console.log("MMGM dev server — use these URLs (NOT 0.0.0.0):");
console.log(`  Local:   http://localhost:${port}`);
for (const ip of lanIps) {
  console.log(`  Network: http://${ip}:${port}`);
}
if (lanIps.length === 0) {
  console.log("  Network: (no LAN IPv4 found — use ipconfig to check your IP)");
}
console.log("");

const child = spawn("pnpm", ["exec", "next", "dev", "--hostname", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  env: process.env,
  cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
