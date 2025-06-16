import { UpnanceProvider } from "./services/upnance-provider"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [UpnanceProvider],
})
