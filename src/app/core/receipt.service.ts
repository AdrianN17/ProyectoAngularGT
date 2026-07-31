import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ReceiptData {
  paymentId:    string;
  amount:       number;
  currency:     string;
  fromWalletId: string;
  fromName:     string;
  toWalletId:   string;
  toName:       string;
  createdAt:    string;
}

export interface RechargeReceiptData {
  rechargeId: string;
  amount:     number;
  currency:   string;
  walletId:   string;
  walletName: string;
  createdAt:  string;
}

interface DrawSection {
  label: string;
  id?:   string;
  name:  string;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly platformId = inject(PLATFORM_ID);

  // ─── Public API ───────────────────────────────────────────────────────────

  download(data: ReceiptData): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const sections: DrawSection[] = [
      { label: 'WALLET ORIGEN',  id: data.fromWalletId, name: data.fromName },
      { label: 'WALLET DESTINO', id: data.toWalletId,   name: data.toName   },
      { label: 'HORA',                                   name: this.formatDate(data.createdAt) },
    ];

    void this.renderPng(
      'HAS TRANSFERIDO', data.amount, data.currency,
      sections, 'TRANSACCIÓN ID', data.paymentId,
      `comprobante-${data.paymentId.slice(0, 8)}.png`,
    );
  }

  downloadRecharge(data: RechargeReceiptData): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const sections: DrawSection[] = [
      { label: 'WALLET DESTINO', id: data.walletId, name: data.walletName },
      { label: 'HORA',                               name: this.formatDate(data.createdAt) },
    ];

    void this.renderPng(
      'HAS RECARGADO', data.amount, data.currency,
      sections, 'RECARGA ID', data.rechargeId,
      `comprobante-recarga-${data.rechargeId.slice(0, 8)}.png`,
    );
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso
      : d.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private async loadImage(src: string): Promise<HTMLImageElement | null> {
    try {
      const res  = await fetch(src);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      return new Promise(resolve => {
        const img   = new Image();
        img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      });
    } catch { return null; }
  }

  private async renderPng(
    title: string, amount: number, currency: string,
    sections: DrawSection[], footerLabel: string, footerId: string, filename: string,
  ): Promise<void> {
    const logo = await this.loadImage('/logo.avif');

    // ── Layout constants ──────────────────────────────────────────────────
    const SCALE   = 2;
    const W       = 440;
    const CARD_X  = 20;
    const PAD     = 32;           // inner horizontal padding
    const IX      = CARD_X + PAD; // inner content x = 52
    const IW      = W - CARD_X * 2 - PAD * 2; // inner width = 336
    const HEADER_H = 112;
    const FONT    = "'Segoe UI', system-ui, -apple-system, sans-serif";
    const MONO    = "'Consolas', 'Courier New', monospace";

    // Dynamic height
    let cardContent = 56; // amount row
    sections.forEach(s => { cardContent += s.id ? 80 : 62; }); // per-section
    cardContent += 28 + 64; // dashed sep + footer
    const CARD_H  = HEADER_H + cardContent;
    const CANVAS_H = CARD_H + CARD_X * 2 + 8;

    // ── Canvas setup ──────────────────────────────────────────────────────
    const canvas    = document.createElement('canvas');
    canvas.width    = W * SCALE;
    canvas.height   = CANVAS_H * SCALE;
    const ctx       = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);
    const CX        = W / 2; // horizontal center
    const CARD_Y    = CARD_X;

    // Background
    ctx.fillStyle = '#EEF2FF';
    ctx.fillRect(0, 0, W, CANVAS_H);

    // Card shadow + fill
    ctx.save();
    ctx.shadowColor   = 'rgba(10,37,64,0.13)';
    ctx.shadowBlur    = 28;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle     = '#FFFFFF';
    this.rrect(ctx, CARD_X, CARD_Y, W - CARD_X * 2, CARD_H, 16);
    ctx.fill();
    ctx.restore();

    // Header gradient (#1A73E8 → #00C4CC)
    const grad = ctx.createLinearGradient(CARD_X, 0, CARD_X + W - CARD_X * 2, 0);
    grad.addColorStop(0, '#1A73E8');
    grad.addColorStop(1, '#00C4CC');
    ctx.save();
    this.rrectTop(ctx, CARD_X, CARD_Y, W - CARD_X * 2, HEADER_H, 16);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Logo
    const LOGO_H  = 40;
    const LOGO_Y  = CARD_Y + 16;
    if (logo) {
      const aspect = logo.naturalWidth / logo.naturalHeight;
      const lw     = Math.min(130, LOGO_H * aspect);
      ctx.drawImage(logo, CX - lw / 2, LOGO_Y, lw, LOGO_H);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font      = `bold 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('WalletApp', CX, LOGO_Y + 28);
    }

    // Title
    ctx.fillStyle   = 'rgba(255,255,255,0.88)';
    ctx.font        = `600 11px ${FONT}`;
    ctx.textAlign   = 'center';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(title, CX, CARD_Y + HEADER_H - 16);
    ctx.letterSpacing = '0px';

    // ── Amount ────────────────────────────────────────────────────────────
    let y = CARD_Y + HEADER_H + 38;

    const amtStr  = amount.toFixed(2);
    ctx.font      = `bold 42px ${FONT}`;
    const amtW    = ctx.measureText(amtStr).width;
    ctx.font      = `500 20px ${FONT}`;
    const curW    = ctx.measureText('\u2009' + currency).width;
    const totalW  = amtW + curW;
    const startX  = CX - totalW / 2;

    ctx.font      = `bold 42px ${FONT}`;
    ctx.fillStyle = '#0A2540';
    ctx.textAlign = 'left';
    ctx.fillText(amtStr, startX, y);

    ctx.font      = `500 20px ${FONT}`;
    ctx.fillStyle = '#64748B';
    ctx.fillText('\u2009' + currency, startX + amtW, y - 4);

    y += 20;

    // ── Sections ──────────────────────────────────────────────────────────
    for (const sec of sections) {
      y += 20;
      // Separator
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(IX, y); ctx.lineTo(IX + IW, y); ctx.stroke();
      y += 16;

      // Label
      ctx.font        = `600 10px ${FONT}`;
      ctx.fillStyle   = '#64748B';
      ctx.textAlign   = 'left';
      ctx.letterSpacing = '0.8px';
      ctx.fillText(sec.label, IX, y);
      ctx.letterSpacing = '0px';
      y += 18;

      // ID (monospace, truncated)
      if (sec.id) {
        ctx.font      = `11px ${MONO}`;
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(this.trunc(sec.id, 42), IX, y);
        y += 20;
      }

      // Name
      ctx.font      = `bold 15px ${FONT}`;
      ctx.fillStyle = '#0A2540';
      ctx.fillText(sec.name, IX, y);
      y += 8;
    }

    // ── Dashed separator ─────────────────────────────────────────────────
    y += 24;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(IX, y); ctx.lineTo(IX + IW, y); ctx.stroke();
    ctx.setLineDash([]);

    // ── Footer ────────────────────────────────────────────────────────────
    y += 22;
    ctx.font        = `600 10px ${FONT}`;
    ctx.fillStyle   = '#94A3B8';
    ctx.textAlign   = 'center';
    ctx.letterSpacing = '0.8px';
    ctx.fillText(footerLabel, CX, y);
    ctx.letterSpacing = '0px';

    y += 18;
    ctx.font      = `12px ${MONO}`;
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(footerId, CX, y);

    // ── Download ─────────────────────────────────────────────────────────
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // ── Canvas helpers ────────────────────────────────────────────────────────

  private rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);   ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);   ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x, y + r);       ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
  }

  private rrectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x,     y + h);
    ctx.lineTo(x, y + r);     ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  private trunc(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }
}

