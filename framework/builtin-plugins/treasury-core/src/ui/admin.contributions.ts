import {
  defineAdminNav,
  defineCommand,
  definePage,
  defineWorkspace,
  type AdminContributionRegistry
} from "@platform/admin-contracts";

import { BusinessAdminPage } from "./admin/main.page";

export const adminContributions: Pick<AdminContributionRegistry, "workspaces" | "nav" | "pages" | "commands"> = {
  workspaces: [
    defineWorkspace({
      id: "treasury",
      label: "Treasury",
      icon: "landmark",
      description: "Cash posture, liquidity, and banking operations.",
      permission: "treasury.cash-position.read",
      homePath: "/admin/business/treasury",
      quickActions: ["treasury-core.open.control-room"]
    })
  ],
  nav: [
    defineAdminNav({
      workspace: "treasury",
      group: "control-room",
      items: [
        {
          id: "treasury-core.overview",
          label: "Control Room",
          icon: "landmark",
          to: "/admin/business/treasury",
          permission: "treasury.cash-position.read"
        }
      ]
    })
  ],
  pages: [
    definePage({
      id: "treasury-core.page",
      kind: "dashboard",
      route: "/admin/business/treasury",
      label: "Treasury Control Room",
      workspace: "treasury",
      group: "control-room",
      permission: "treasury.cash-position.read",
      component: BusinessAdminPage
    })
  ],
  commands: [
    defineCommand({
      id: "treasury-core.open.control-room",
      label: "Open Treasury Core",
      permission: "treasury.cash-position.read",
      href: "/admin/business/treasury",
      keywords: ["treasury core","treasury","business"]
    })
  ]
};
