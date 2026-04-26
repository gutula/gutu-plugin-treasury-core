/** Host-plugin contribution for treasury-core.
 *
 *  Mounts at /api/<routes> via the shell's plugin loader. */
import type { HostPlugin } from "@gutu-host/plugin-contract";

import { bankReconRoutes } from "./routes/bank-reconciliation";


export const hostPlugin: HostPlugin = {
  id: "treasury-core",
  version: "1.0.0",
  dependsOn: ["accounting-core"],
  
  routes: [
    { mountPath: "/bank-reconciliation", router: bankReconRoutes }
  ],
};

// Re-export the lib API so other plugins can `import` from
// "@gutu-plugin/treasury-core".
export * from "./lib";
