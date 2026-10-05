import { AZURE_ICON_CATALOG } from "./azureIconCatalog";
import { iconifyDataUri, LOGOS_CATALOG, type IconOption } from "./iconifyIcons";
import { MICROSOFT365_ICON_CATALOG } from "./microsoft365IconCatalog";

export type { IconOption };

// Azure e Microsoft 365 prima (più rilevanti per questa app), poi i loghi generici. Usato dalla
// ricerca testuale sia nel form di creazione (IconPicker) sia nel dialog di cambio icona (IconChangeDialog).
export const SEARCHABLE_ICONS: IconOption[] = [...AZURE_ICON_CATALOG, ...MICROSOFT365_ICON_CATALOG, ...LOGOS_CATALOG];

// Cataloga le icone disponibili in public/icons (design/icons di riferimento): id = nome file senza estensione.

export const ICON_CATALOG: IconOption[] = [
  { id: "ai", label: "Application Insights" },
  { id: "apim", label: "API Management" },
  { id: "app", label: "App Service" },
  { id: "bc", label: "Business Central" },
  { id: "blob", label: "Blob Storage" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "dotnet", label: ".NET" },
  { id: "entra", label: "Microsoft Entra ID" },
  { id: "ext", label: "Entra External ID" },
  { id: "func", label: "Azure Functions" },
  { id: "kv", label: "Key Vault" },
  { id: "next", label: "Next.js" },
  { id: "sb", label: "Service Bus" },
  { id: "sendgrid", label: "SendGrid" },
  { id: "sql", label: "SQL Database" },
  { id: "stripe", label: "Stripe" },
  { id: "vnet", label: "VNet" },
];

// Punto unico per risolvere un id icona in un url utilizzabile sia in <img src> che in <image href> (SVG):
// le icone curate sono file statici in public/icons, quelle del catalogo esteso ("logos:...") diventano
// una data URI generata al volo dai dati del set bundlato (nessuna chiamata di rete, resta offline).
export function resolveIconUrl(id: string): string {
  if (id.startsWith("logos:")) return iconifyDataUri(id.slice(6)) ?? "";
  return `/icons/${id}.svg`;
}
