import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatAmount, convertAmount } from "~/lib/utils/currency";
import type { CurrencyCode } from "~/lib/utils/currency";
import type { InvoiceWithItems } from "~/lib/types";

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = "#09090b"; // zinc-950
const ACCENT_LIGHT = "#f4f4f5"; // zinc-100
const BORDER = "#e4e4e7"; // zinc-200
const MUTED = "#71717a"; // zinc-500
const TEXT = "#3f3f46"; // zinc-700

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 9,
    color: MUTED,
  },
  invoiceLabelBlock: {
    alignItems: "flex-end",
  },
  invoiceLabel: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },
  // ── Divider ──
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 24,
  },
  // ── Info row ──
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    marginBottom: 1,
  },
  infoSub: {
    fontSize: 9,
    color: TEXT,
  },
  infoRight: {
    alignItems: "flex-end",
  },
  infoRightRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  infoRightLabel: {
    fontSize: 9,
    color: MUTED,
    width: 90,
    textAlign: "right",
  },
  infoRightValue: {
    fontSize: 9,
    color: TEXT,
    width: 80,
    textAlign: "right",
  },
  // ── Table ──
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ACCENT,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 3,
  },
  colDescription: { flex: 1 },
  colQty: { width: 36, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  tableCell: {
    fontSize: 9,
    color: TEXT,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
  },
  // ── Totals ──
  totalsContainer: {
    alignItems: "flex-end",
    marginBottom: 28,
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 9,
    color: MUTED,
    width: 120,
    textAlign: "right",
    marginRight: 16,
  },
  totalValue: {
    fontSize: 9,
    color: TEXT,
    width: 90,
    textAlign: "right",
  },
  totalDivider: {
    width: 226,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 8,
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    width: 120,
    textAlign: "right",
    marginRight: 16,
  },
  totalFinalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    width: 90,
    textAlign: "right",
  },
  // ── Notes ──
  notesBlock: {
    marginBottom: 28,
    padding: 12,
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
  },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFmt(from: CurrencyCode, to: CurrencyCode) {
  return (amount: number) => formatAmount(convertAmount(amount, from, to), to);
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CompanyInfo {
  name: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  siret?: string;
  website?: string;
}

interface InvoicePDFDocumentProps {
  invoice: InvoiceWithItems;
  company?: CompanyInfo;
  displayCurrency?: CurrencyCode;
}

export function InvoicePDFDocument({
  invoice,
  company,
  displayCurrency,
}: InvoicePDFDocumentProps) {
  const invoiceCurrency = (invoice.currency ?? "EUR") as CurrencyCode;
  const outputCurrency = displayCurrency ?? invoiceCurrency;
  const fmt = makeFmt(invoiceCurrency, outputCurrency);
  const companyName = company?.name || "Mon Entreprise";

  return (
    <Document
      title={invoice.invoice_number}
      author={companyName}
      subject={`Facture ${invoice.invoice_number}`}
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{companyName}</Text>
            {company?.tagline ? (
              <Text style={s.companyTagline}>{company.tagline}</Text>
            ) : null}
            {company?.email ? (
              <Text style={s.companyTagline}>{company.email}</Text>
            ) : null}
            {company?.phone ? (
              <Text style={s.companyTagline}>{company.phone}</Text>
            ) : null}
            {company?.address ? (
              <Text style={s.companyTagline}>{company.address}</Text>
            ) : null}
          </View>
          <View style={s.invoiceLabelBlock}>
            <Text style={s.invoiceLabel}>FACTURE</Text>
            <Text style={s.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Info row ── */}
        <View style={s.infoRow}>
          {/* Client */}
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Facturé à</Text>
            <Text style={s.infoValue}>{invoice.client?.name ?? "—"}</Text>
            {invoice.client?.company ? (
              <Text style={s.infoSub}>{invoice.client.company}</Text>
            ) : null}
          </View>

          {/* Dates */}
          <View style={[s.infoBlock, s.infoRight]}>
            <View style={s.infoRightRow}>
              <Text style={s.infoRightLabel}>Date d'émission</Text>
              <Text style={s.infoRightValue}>{fmtDate(invoice.issue_date)}</Text>
            </View>
            {invoice.due_date ? (
              <View style={s.infoRightRow}>
                <Text style={s.infoRightLabel}>Date d'échéance</Text>
                <Text style={s.infoRightValue}>{fmtDate(invoice.due_date)}</Text>
              </View>
            ) : null}
            <View style={s.infoRightRow}>
              <Text style={s.infoRightLabel}>Statut</Text>
              <Text style={s.infoRightValue}>
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Items table ── */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colDescription]}>Description</Text>
            <Text style={[s.tableHeaderText, s.colQty]}>Qté</Text>
            <Text style={[s.tableHeaderText, s.colPrice]}>Prix unit.</Text>
            <Text style={[s.tableHeaderText, s.colTotal]}>Total</Text>
          </View>

          {/* Rows */}
          {invoice.items.map((item, i) => (
            <View
              key={item.id}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <Text style={[s.tableCell, s.colDescription]}>{item.description}</Text>
              <Text style={[s.tableCell, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.tableCell, s.colPrice]}>{fmt(item.unit_price)}</Text>
              <Text style={[s.tableCellBold, s.colTotal]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsContainer}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Sous-total HT</Text>
            <Text style={s.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>
          {invoice.tax_rate > 0 ? (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TVA ({invoice.tax_rate}%)</Text>
              <Text style={s.totalValue}>{fmt(invoice.tax_amount)}</Text>
            </View>
          ) : null}
          <View style={s.totalDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalFinalLabel}>Total TTC</Text>
            <Text style={s.totalFinalValue}>{fmt(invoice.total)}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {invoice.notes ? (
          <View style={s.notesBlock}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {company?.siret ? `SIRET : ${company.siret}` : "Merci pour votre confiance."}
          </Text>
          <Text style={s.footerText}>{invoice.invoice_number}</Text>
        </View>
      </Page>
    </Document>
  );
}
