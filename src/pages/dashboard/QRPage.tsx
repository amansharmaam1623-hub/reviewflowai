import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Copy,
  Check,
  QrCode,
  Palette,
  Plus,
  RefreshCw,
  ExternalLink,
  Eye,
  Calendar,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  Share2,
  Power,
  Copy as Duplicate,
  X,
  Search,
  AlertCircle,
  Clock,
  TrendingUp,
  Hash,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  RealQRCode,
  downloadQrPng,
  downloadQrSvg,
} from "@/components/ui/RealQRCode";
import { useBusinesses, useQrCodes } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";
import {
  supabase,
  type QrCode as QrCodeType,
  type Business,
} from "@/lib/supabase";

type Filter = "all" | "active" | "inactive";

interface ActionMenuState {
  qrId: string | null;
  x: number;
  y: number;
}

export function QRPage() {
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { qrCodes, loading: qrLoading, refetch } = useQrCodes(businessIds);
  // useQrCodes cannot tell "no businesses" from "businesses not fetched yet", so
  // it reports loaded-and-empty on the first pass. Without this the page flashes
  // its "No business yet" / "No QR code selected" empty states before the data
  // arrives, which reads as the QR having vanished.
  const loading = businessesLoading || qrLoading;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#4285F4");
  const [targetUrl, setTargetUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [actionMenu, setActionMenu] = useState<ActionMenuState>({
    qrId: null,
    x: 0,
    y: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState<QrCodeType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<QrCodeType | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const selectedBusiness = businesses[0] ?? null;

  useEffect(() => {
    if (qrCodes.length > 0 && !selectedId) {
      const first = qrCodes[0];
      setSelectedId(first.id);
      setLabel(first.identifier);
      setColor("#4285F4");
      setTargetUrl(
        first.target_url || selectedBusiness?.google_business_url || ""
      );
    }
  }, [qrCodes, selectedId, selectedBusiness]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu({ qrId: null, x: 0, y: 0 });
      }
    };
    if (actionMenu.qrId) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [actionMenu.qrId]);

  const selected = qrCodes.find((q) => q.id === selectedId) ?? null;

  const qrValue = useMemo(() => {
    if (!selected) return "";
    return `${window.location.origin}/review/${selected.id}`;
  }, [selected]);

  const filteredQrCodes = useMemo(() => {
    return qrCodes.filter((qr) => {
      const matchesSearch = qr?.label
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" || (filter === "active" ? qr.active : !qr.active);
      return matchesSearch && matchesFilter;
    });
  }, [qrCodes, search, filter]);

  const copyLink = () => {
    if (!selected) return;
    navigator.clipboard?.writeText(qrValue);
    setCopied(true);
    showToast("QR link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectQr = (qrId: string) => {
    const qr = qrCodes.find((q) => q.id === qrId);
    if (!qr) return;
    setSelectedId(qr.id);
    setLabel(qr.identifier);
    setColor("#4285F4");
    setTargetUrl(qr.target_url || selectedBusiness?.google_business_url || "");
  };

  const createQr = async () => {
    if (!selectedBusiness) return;
    setBusyAction("create");
    const defaultUrl = selectedBusiness.google_business_url || "";
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        business_id: selectedBusiness.id,
        user_id: (selectedBusiness as any).user_id,
        identifier: `QR Code ${qrCodes.length + 1}`,
        target_url: defaultUrl,
        scan_count: 0,
        is_active: qrCodes.length === 0,
      })
      .select("*")
      .single();
    setBusyAction(null);
    if (error) {
      showToast("Failed to create QR code", "error");
      return;
    }
    await refetch();
    selectQr(data.id);
    showToast("QR code created successfully");
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("qr_codes")
      .update({
        identifier: label,
        target_url: targetUrl,
      })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      showToast("Failed to save changes", "error");
      return;
    }
    setSaved(true);
    showToast("Changes saved successfully");
    setTimeout(() => setSaved(false), 2500);
    refetch();
  };

  // Export the colour the user actually picked, and do not refetch afterwards -
  // a download changes nothing server-side, and the refetch only served to blank
  // the page back to its skeleton.
  const downloadColor = (qr: QrCodeType) =>
    qr.id === selectedId ? color : "#4285F4";
  const fileBase = (qr: QrCodeType) =>
    (qr.identifier || "qr-code").replace(/\s+/g, "-").toLowerCase();

  const handleDownloadPng = async (qr: QrCodeType) => {
    await downloadQrPng(
      `${window.location.origin}/review/${qr.id}`,
      downloadColor(qr),
      fileBase(qr)
    );
    showToast("PNG downloaded");
  };

  const handleDownloadSvg = async (qr: QrCodeType) => {
    await downloadQrSvg(
      `${window.location.origin}/review/${qr.id}`,
      downloadColor(qr),
      fileBase(qr)
    );
    showToast("SVG downloaded");
  };

  const activateQr = async (qr: QrCodeType) => {
    setBusyAction(qr.id);
    setActionMenu({ qrId: null, x: 0, y: 0 });
    // Deactivate all other QRs for this business, then activate this one
    const others = qrCodes.filter(
      (q) => q.business_id === qr.business_id && q.id !== qr.id
    );
    if (others.length > 0) {
      await supabase
        .from("qr_codes")
        .update({ is_active: false })
        .in(
          "id",
          others.map((o) => o.id)
        );
    }
    const { error } = await supabase
      .from("qr_codes")
      .update({ is_active: true })
      .eq("id", qr.id);
    setBusyAction(null);
    if (error) {
      showToast("Failed to activate QR code", "error");
      return;
    }
    await refetch();
    showToast("QR code activated — previous active QR deactivated");
  };

  const deactivateQr = async (qr: QrCodeType) => {
    setBusyAction(qr.id);
    setActionMenu({ qrId: null, x: 0, y: 0 });
    const { error } = await supabase
      .from("qr_codes")
      .update({ is_active: false })
      .eq("id", qr.id);
    setBusyAction(null);
    if (error) {
      showToast("Failed to deactivate QR code", "error");
      return;
    }
    await refetch();
    showToast("QR code deactivated");
  };

  const duplicateQr = async (qr: QrCodeType) => {
    setBusyAction(qr.id);
    setActionMenu({ qrId: null, x: 0, y: 0 });
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        business_id: qr.business_id,
        user_id: qr.user_id,
        identifier: `${qr.identifier} (Copy)`,
        target_url: qr.target_url,
        scan_count: 0,
        is_active: false,
      })
      .select("*")
      .single();
    setBusyAction(null);
    if (error) {
      showToast("Failed to duplicate QR code", "error");
      return;
    }
    await refetch();
    showToast("QR code duplicated");
  };

  const shareQr = async (qr: QrCodeType) => {
    setActionMenu({ qrId: null, x: 0, y: 0 });
    const url = `${window.location.origin}/review/${qr.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: qr.identifier, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied to clipboard");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("qr_codes")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      showToast("Failed to delete QR code", "error");
      return;
    }
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
    await refetch();
    showToast("QR code deleted");
  };

  const openRename = (qr: QrCodeType) => {
    setActionMenu({ qrId: null, x: 0, y: 0 });
    setRenameTarget(qr);
    setRenameValue(qr.identifier);
  };

  const confirmRename = async () => {
    if (!renameTarget) return;
    setRenaming(true);
    const { error } = await supabase
      .from("qr_codes")
      .update({ identifier: renameValue })
      .eq("id", renameTarget.id);
    setRenaming(false);
    if (error) {
      showToast("Failed to rename QR code", "error");
      return;
    }
    setRenameTarget(null);
    await refetch();
    showToast("QR code renamed");
  };

  const openActionMenu = (e: React.MouseEvent, qrId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuW = 200;
    const x = Math.min(rect.right - menuW, rect.left);
    const y = rect.bottom + 4;
    setActionMenu({ qrId, x, y });
  };

  const regenerateFromBusiness = () => {
    if (selectedBusiness?.google_business_url) {
      setTargetUrl(selectedBusiness.google_business_url);
      showToast("URL synced from business profile");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatRelative = (d: string | null) => {
    if (!d) return "Never";
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return formatDate(d);
  };

  const getBusiness = (bizId: string) => businesses.find((b) => b.id === bizId);

  if (loading) {
    return (
      <>
        <Topbar
          title="QR Code Generator"
          subtitle="Create, customize, and download branded QR codes"
        />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-8 flex items-center justify-center">
            <div className="w-[240px] h-[240px] rounded-2xl bg-ink-100 animate-pulse-soft" />
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="space-y-2">
                  <div className="h-5 w-32 rounded bg-ink-100 animate-pulse-soft" />
                  <div className="h-3 w-24 rounded bg-ink-100 animate-pulse-soft" />
                </div>
                <div className="h-9 w-20 rounded-xl bg-ink-100 animate-pulse-soft" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-ink-50 border border-ink-200/60 animate-pulse-soft"
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-6 space-y-4">
              <div className="h-5 w-24 rounded bg-ink-100 animate-pulse-soft" />
              <div className="h-9 w-full rounded-xl bg-ink-100 animate-pulse-soft" />
              <div className="h-11 w-full rounded-xl bg-ink-100 animate-pulse-soft" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (businesses.length === 0) {
    return (
      <>
        <Topbar
          title="QR Code Generator"
          subtitle="Create, customize, and download branded QR codes"
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
            <QrCode className="h-7 w-7 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-800 mb-2">
            No business yet
          </h3>
          <p className="text-sm text-ink-500 mb-4">
            Add your business first to start generating QR codes.
          </p>
          <Button onClick={() => navigate("/dashboard/business")}>
            Add your business
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="QR Code Generator"
        subtitle="Create, customize, and download branded QR codes"
      />

      {/* Search + Filter + Create */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QR codes by name…"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 h-11 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                filter === f
                  ? "bg-ink-800 text-white"
                  : "bg-white border border-ink-200 text-ink-600 hover:border-ink-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          size="md"
          leftIcon={
            busyAction === "create" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )
          }
          onClick={createQr}
          loading={busyAction === "create"}
          className="shrink-0"
        >
          New QR
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: QR preview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-ink-200/70 shadow-card flex flex-col"
        >
          {selected ? (
            <>
              <div className="flex items-center justify-center p-6 sm:p-8">
                <div
                  className="rounded-2xl p-3 bg-white border-2 qr-border-responsive"
                  style={{ borderColor: color }}
                >
                  <RealQRCode
                    value={qrValue}
                    color={color}
                    size={260}
                    className="qr-canvas-responsive"
                  />
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-ink-800 break-words leading-snug">
                      {selectedBusiness?.name || "My Business"}
                    </h3>
                    <p className="text-xs text-ink-500 break-words">
                      {label || selected.identifier}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-ink-50 border border-ink-200/60 p-3">
                    <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide mb-1">
                      Status
                    </p>
                    <Badge color={selected.is_active ? "green" : "gray"}>
                      {selected.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-ink-50 border border-ink-200/60 p-3">
                    <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide mb-1">
                      Scans
                    </p>
                    <p className="text-sm font-bold text-ink-800">
                      {(selected.scan_count || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-ink-50 border border-ink-200/60 p-3 col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide mb-1">
                      Last Scan
                    </p>
                    <p className="text-sm font-bold text-ink-800">
                      {formatRelative(selected.last_scan_at)}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-ink-50 border border-ink-200/60 flex items-center justify-between gap-2">
                  <span
                    className="text-xs text-ink-600 truncate font-mono"
                    title={qrValue}
                  >
                    {qrValue.replace(window.location.origin, "")}
                  </span>
                  <button
                    onClick={copyLink}
                    className="shrink-0 h-7 w-7 rounded-lg bg-white flex items-center justify-center hover:bg-ink-100 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-google-green" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-ink-500" />
                    )}
                  </button>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={() => handleDownloadPng(selected)}
                      className="w-full"
                    >
                      PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                      onClick={() => handleDownloadSvg(selected)}
                      className="w-full"
                    >
                      SVG
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    leftIcon={<Eye className="h-4 w-4" />}
                    onClick={() =>
                      window.open(qrValue, "_blank", "noopener,noreferrer")
                    }
                  >
                    Preview Customer Flow
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-ink-100 flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-ink-400" />
              </div>
              <h3 className="text-base font-bold text-ink-800 mb-2">
                No QR code selected
              </h3>
              <p className="text-sm text-ink-500 mb-4">
                Create your first QR code to get started.
              </p>
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={createQr}
              >
                Generate QR Code
              </Button>
            </div>
          )}
        </motion.div>

        {/* Right: list + customize */}
        <div className="flex flex-col gap-6">
          {/* QR list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5 sm:p-6 flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-800">
                  Your QR Codes
                </h3>
                <p className="text-xs text-ink-500">
                  {filteredQrCodes.length} of {qrCodes.length} codes
                </p>
              </div>
            </div>

            {filteredQrCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-ink-500 mb-4">
                  {qrCodes.length === 0
                    ? "No QR codes yet. Create your first one!"
                    : "No QR codes match your search."}
                </p>
                {qrCodes.length === 0 && (
                  <Button
                    size="sm"
                    leftIcon={<QrCode className="h-4 w-4" />}
                    onClick={createQr}
                  >
                    Generate QR Code
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredQrCodes.map((qr) => {
                  const biz = getBusiness(qr.business_id);
                  return (
                    <motion.div
                      key={qr.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      onClick={() => selectQr(qr.id)}
                      className={`relative text-left rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        selectedId === qr.id
                          ? "border-google-blue bg-google-blue/5 shadow-soft"
                          : "border-ink-200/70 hover:border-ink-300 hover:shadow-soft"
                      }`}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: "#4285F415",
                              border: "1.5px solid #4285F4",
                            }}
                          >
                            <QrCode
                              className="h-4.5 w-4.5"
                              style={{ color: "#4285F4" }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-ink-800 truncate">
                              {qr.identifier}
                            </div>
                            <div className="text-xs text-ink-500 truncate">
                              {biz?.name || "Business"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => openActionMenu(e, qr.id)}
                          className="shrink-0 h-7 w-7 rounded-lg hover:bg-ink-100 flex items-center justify-center transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-ink-500" />
                        </button>
                      </div>

                      {/* Card stats */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge color={qr.is_active ? "green" : "gray"}>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              qr.is_active ? "bg-google-green" : "bg-ink-400"
                            }`}
                          />
                          {qr.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-ink-500 flex items-center gap-1">
                          <Hash className="h-3 w-3" />{" "}
                          {(qr.scan_count || 0).toLocaleString()} scans
                        </span>
                      </div>

                      {/* Card footer */}
                      <div className="flex items-center justify-between text-[11px] text-ink-400 pt-2 border-t border-ink-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{" "}
                          {formatDate(qr.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{" "}
                          {formatRelative(qr.last_scan_at)}
                        </span>
                      </div>

                      {busyAction === qr.id && (
                        <div className="absolute inset-0 rounded-xl bg-white/60 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-google-blue animate-spin" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Customize panel */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white border border-ink-200/70 shadow-card p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Palette className="h-4 w-4 text-ink-600" />
                <h3 className="text-base font-bold text-ink-800">Customize</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    Brand Color
                  </label>
                  <div className="flex gap-2.5 flex-wrap">
                    {[
                      "#4285F4",
                      "#34A853",
                      "#FBBC05",
                      "#EA4335",
                      "#202124",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-9 w-9 rounded-xl transition-transform hover:scale-110 ${
                          color === c ? "ring-2 ring-offset-2 ring-ink-300" : ""
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    QR Label
                  </label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink-700">
                      Google Review URL
                    </label>
                    <button
                      onClick={regenerateFromBusiness}
                      className="flex items-center gap-1 text-xs font-medium text-google-blue hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" /> Sync from business
                    </button>
                  </div>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                    <input
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://google.com/maps/review/…"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors"
                    />
                  </div>
                  <p
                    className="mt-1.5 text-xs text-ink-400 truncate"
                    title={targetUrl}
                  >
                    This URL is where customers land after the review flow.
                    Update it here or sync from your business profile.
                  </p>
                </div>
                <div className="pt-1">
                  <Button
                    onClick={saveChanges}
                    loading={saving}
                    leftIcon={
                      saved ? (
                        <Check className="h-4 w-4 text-google-green" />
                      ) : undefined
                    }
                    className="w-full sm:w-auto"
                  >
                    {saved ? "Saved!" : "Save changes"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Menu Dropdown */}
      <AnimatePresence>
        {actionMenu.qrId && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setActionMenu({ qrId: null, x: 0, y: 0 })}
            />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 w-48 rounded-xl bg-white shadow-float border border-ink-200/70 py-1.5"
              style={{ left: actionMenu.x, top: actionMenu.y }}
            >
              {(() => {
                const qr = qrCodes.find((q) => q.id === actionMenu.qrId);
                if (!qr) return null;
                return (
                  <>
                    <MenuItem
                      icon={<Eye className="h-4 w-4" />}
                      label="Preview"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectQr(qr.id);
                        setActionMenu({ qrId: null, x: 0, y: 0 });
                      }}
                    />
                    <MenuItem
                      icon={<Pencil className="h-4 w-4" />}
                      label="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectQr(qr.id);
                        setActionMenu({ qrId: null, x: 0, y: 0 });
                      }}
                    />
                    <MenuItem
                      icon={<Pencil className="h-4 w-4" />}
                      label="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRename(qr);
                      }}
                    />
                    <MenuDivider />
                    <MenuItem
                      icon={<Download className="h-4 w-4" />}
                      label="Download PNG"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPng(qr);
                        setActionMenu({ qrId: null, x: 0, y: 0 });
                      }}
                    />
                    <MenuItem
                      icon={<Download className="h-4 w-4" />}
                      label="Download SVG"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSvg(qr);
                        setActionMenu({ qrId: null, x: 0, y: 0 });
                      }}
                    />
                    <MenuDivider />
                    <MenuItem
                      icon={<Duplicate className="h-4 w-4" />}
                      label="Duplicate"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateQr(qr);
                      }}
                    />
                    <MenuItem
                      icon={<Share2 className="h-4 w-4" />}
                      label="Share"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareQr(qr);
                      }}
                    />
                    <MenuDivider />
                    {qr.is_active ? (
                      <MenuItem
                        icon={<Power className="h-4 w-4" />}
                        label="Deactivate"
                        onClick={(e) => {
                          e.stopPropagation();
                          deactivateQr(qr);
                        }}
                      />
                    ) : (
                      <MenuItem
                        icon={<Power className="h-4 w-4" />}
                        label="Activate"
                        onClick={(e) => {
                          e.stopPropagation();
                          activateQr(qr);
                        }}
                      />
                    )}
                    <MenuDivider />
                    <MenuItem
                      icon={<Trash2 className="h-4 w-4" />}
                      label="Delete"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(qr);
                        setActionMenu({ qrId: null, x: 0, y: 0 });
                      }}
                    />
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white shadow-float border border-ink-200/70 p-6 text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-2xl bg-google-red/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-google-red" />
              </div>
              <h3 className="text-lg font-bold text-ink-800 mb-2">
                Delete QR Code?
              </h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-6">
                Are you sure you want to delete this QR Code? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={confirmDelete}
                  loading={deleting}
                  leftIcon={
                    !deleting ? <Trash2 className="h-4 w-4" /> : undefined
                  }
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename modal */}
      <AnimatePresence>
        {renameTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => !renaming && setRenameTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white shadow-float border border-ink-200/70 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-ink-800">
                  Rename QR Code
                </h3>
                <button
                  onClick={() => setRenameTarget(null)}
                  className="h-8 w-8 rounded-lg hover:bg-ink-100 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-ink-500" />
                </button>
              </div>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="w-full h-11 px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm text-ink-800 outline-none focus:border-google-blue transition-colors mb-4"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRenameTarget(null)}
                  disabled={renaming}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmRename}
                  loading={renaming}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors text-left ${
        danger
          ? "text-google-red hover:bg-google-red/5"
          : "text-ink-700 hover:bg-ink-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-ink-100" />;
}
