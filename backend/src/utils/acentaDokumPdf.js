const path = require('path');
const PDFDocument = require('pdfkit');

const FONT_REGULAR = path.join(__dirname, '../../assets/fonts/ArialUnicode.ttf');
const FONT_BOLD = path.join(__dirname, '../../assets/fonts/ArialUnicode.ttf');

const PAGE_BOTTOM = 40;
const ROW_PAD = 3;
const COL_GAP = 5;
const PAGE_MARGIN = 36;

function fmtNum(value) {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function fmtTL(value) {
  return `${fmtNum(value)} TL`;
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('tr-TR');
}

function fmtDateRange(start, end) {
  return `${fmtDate(start)} — ${fmtDate(end)}`;
}

function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function buildColumns(specs, totalWidth) {
  const gapTotal = (specs.length - 1) * COL_GAP;
  const fixed = specs.filter((s) => s.width).reduce((sum, s) => sum + s.width, 0);
  const flexCount = specs.filter((s) => !s.width).length;
  const flexUnit = flexCount > 0 ? (totalWidth - gapTotal - fixed) / flexCount : 0;

  let x = 0;
  return specs.map((spec) => {
    const width = spec.width || flexUnit;
    const col = { ...spec, width, x };
    x += width + COL_GAP;
    return col;
  });
}

function cellTextHeight(doc, text, col, fontSize) {
  doc.font('Regular').fontSize(fontSize);
  return doc.heightOfString(String(text ?? '—'), {
    width: col.width,
    align: col.align || 'left',
  });
}

function drawCell(doc, text, col, y, rowH, fontSize, bold = false) {
  const str = String(text ?? '—');
  const align = col.align || 'left';
  doc.font(bold ? 'Bold' : 'Regular').fontSize(fontSize);

  doc.save();
  doc.rect(col.x, y - 1, col.width, rowH + 2).clip();

  if (align === 'right') {
    const textW = Math.min(doc.widthOfString(str), col.width);
    doc.text(str, col.x + col.width - textW, y, {
      width: textW,
      lineBreak: false,
      continued: false,
    });
  } else {
    doc.text(str, col.x, y, {
      width: col.width,
      align: 'left',
      lineBreak: true,
      continued: false,
    });
  }

  doc.restore();
}

function createLayout(doc) {
  let y = doc.page.margins.top;
  const left = () => doc.page.margins.left;

  function syncDocY() {
    doc.y = y;
  }

  function ensureSpace(needed) {
    const limit = doc.page.height - PAGE_BOTTOM;
    if (y + needed > limit) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: PAGE_MARGIN });
      y = doc.page.margins.top;
      syncDocY();
      return true;
    }
    return false;
  }

  function moveDown(gap = 0) {
    y += gap;
    syncDocY();
  }

  function textLine(str, opts = {}) {
    const {
      size = 10,
      align = 'left',
      color = '#000000',
      bold = false,
      x = left(),
      width = contentWidth(doc),
      gapAfter = size * 1.35,
    } = opts;

    doc.font(bold ? 'Bold' : 'Regular').fontSize(size).fillColor(color);
    const h = doc.heightOfString(String(str), { width, align });
    ensureSpace(h + 2);
    doc.text(String(str), x, y, { width, align, lineBreak: true, continued: false });
    y += h + (gapAfter - size * 1.2);
    syncDocY();
    doc.fillColor('#000000');
  }

  function sectionTitle(title) {
    moveDown(6);
    textLine(title, { size: 11, bold: true, gapAfter: 12 });
    moveDown(2);
  }

  function drawTableHeader(cols, fontSize = 8) {
    ensureSpace(20);
    cols.forEach((col) => {
      drawCell(doc, col.label, col, y, 12, fontSize, true);
    });
    y += 13;
    doc.moveTo(left(), y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .stroke();
    y += ROW_PAD;
    syncDocY();
  }

  function drawTableRow(cols, values, fontSize = 8) {
    let rowH = fontSize + 2;
    values.forEach((text, i) => {
      rowH = Math.max(rowH, cellTextHeight(doc, text, cols[i], fontSize));
    });

    if (ensureSpace(rowH + ROW_PAD)) {
      drawTableHeader(cols, fontSize);
      doc.font('Regular').fontSize(fontSize);
    }

    values.forEach((text, i) => {
      drawCell(doc, text, cols[i], y, rowH, fontSize, false);
    });
    y += rowH + ROW_PAD;
    syncDocY();
  }

  function drawSummaryBox(items, footer) {
    const boxX = left();
    const boxW = Math.min(contentWidth(doc), 420);
    const innerPad = 12;
    const titleH = 16;
    const rowH = 15;
    const footerH = footer ? 14 : 0;
    const boxH = innerPad + titleH + items.length * rowH + footerH + innerPad;
    const valueColW = 130;

    ensureSpace(boxH + 8);

    const boxY = y;
    doc.rect(boxX, boxY, boxW, boxH).fillAndStroke('#f5f6f8', '#d1d5db');
    doc.fillColor('#000000');

    doc.font('Bold').fontSize(11).text('Özet', boxX + innerPad, boxY + innerPad, { continued: false });

    items.forEach(([label, value], i) => {
      const rowY = boxY + innerPad + titleH + i * rowH;
      const isLast = i === items.length - 1;
      doc.font(isLast ? 'Bold' : 'Regular').fontSize(10);
      doc.text(label, boxX + innerPad, rowY, {
        width: boxW - innerPad * 2 - valueColW - 8,
        lineBreak: false,
        continued: false,
      });

      const valueStr = String(value);
      const valueX = boxX + boxW - innerPad - valueColW;
      const textW = Math.min(doc.widthOfString(valueStr), valueColW);
      doc.text(valueStr, valueX + valueColW - textW, rowY, {
        width: textW,
        lineBreak: false,
        continued: false,
      });
    });

    if (footer) {
      doc.font('Regular').fontSize(7).fillColor('#666666')
        .text(footer, boxX + innerPad, boxY + boxH - innerPad - 8, {
          width: boxW - innerPad * 2,
          lineBreak: false,
          continued: false,
        });
      doc.fillColor('#000000');
    }

    y = boxY + boxH;
    syncDocY();
  }

  return {
    moveDown,
    textLine,
    sectionTitle,
    drawTableHeader,
    drawTableRow,
    drawSummaryBox,
  };
}

function offsetColumns(cols, marginLeft) {
  return cols.map((col) => ({ ...col, x: marginLeft + col.x }));
}

function generateAcentaDokumPdf(data) {
  const {
    acenta_adi,
    tarih_baslangic,
    tarih_bitis,
    durum_filter,
    biletler,
    tahsilatlar,
    ozet,
  } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: PAGE_MARGIN,
      bufferPages: true,
    });
    const chunks = [];

    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold', FONT_BOLD);

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const layout = createLayout(doc);
    const cw = contentWidth(doc);
    const ml = doc.page.margins.left;

    layout.textLine('Viking Ölüdeniz', { align: 'center', size: 15, bold: true, gapAfter: 18 });
    layout.textLine(acenta_adi, { align: 'center', size: 13, bold: true, gapAfter: 16 });
    layout.textLine('HİZMET DÖKÜMÜ', { align: 'center', size: 11, bold: true, gapAfter: 14 });
    layout.textLine(fmtDateRange(tarih_baslangic, tarih_bitis), { align: 'center', size: 10, gapAfter: durum_filter?.length ? 6 : 12 });
    if (durum_filter?.length) {
      layout.textLine(`Durum: ${durum_filter.join(', ')}`, {
        align: 'center',
        size: 9,
        color: '#444444',
        gapAfter: 12,
      });
    }
    layout.textLine(`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, {
      align: 'center',
      size: 8,
      color: '#666666',
      gapAfter: 8,
    });
    layout.moveDown(4);

    layout.sectionTitle('Bilet Listesi');

    const biletCols = offsetColumns(
      buildColumns(
        [
          { label: 'Tarih', width: 58 },
          { label: 'Bilet No', width: 58 },
          { label: 'Büyük', width: 30, align: 'right' },
          { label: 'Küçük', width: 30, align: 'right' },
          { label: 'Free', width: 30, align: 'right' },
          { label: 'Alış (TL)', width: 68, align: 'right' },
          { label: 'To Pay (TL)', width: 68, align: 'right' },
          { label: 'İsim' },
          { label: 'Durum', width: 72 },
          { label: 'Otel', width: 80 },
        ],
        cw
      ),
      ml
    );

    layout.drawTableHeader(biletCols);

    if (biletler.length === 0) {
      layout.textLine('Bu tarih aralığında bilet bulunamadı.', { size: 8, gapAfter: 12 });
    } else {
      biletler.forEach((b) => {
        layout.drawTableRow(
          biletCols,
          [
            fmtDate(b.tur_tarihi),
            b.bilet_no || '—',
            String(b.buyuk_kisi || 0),
            String(b.kucuk_kisi || 0),
            String(b.free_kisi || 0),
            fmtNum(b.alis_fiyati),
            fmtNum(b.teknede_odeme),
            b.isim || '—',
            b.durum || '—',
            b.otel || '—',
          ],
          8
        );
      });
    }

    layout.sectionTitle('Tahsilat Kayıtları (Bilet Hesap)');

    const tahCols = offsetColumns(
      buildColumns(
        [
          { label: 'Tarih', width: 72 },
          { label: 'Tutar (TL)', width: 80, align: 'right' },
          { label: 'Açıklama' },
        ],
        cw
      ),
      ml
    );

    layout.drawTableHeader(tahCols);

    if (tahsilatlar.length === 0) {
      layout.textLine('Tahsilat kaydı yok.', { size: 8, gapAfter: 12 });
    } else {
      tahsilatlar.forEach((t) => {
        layout.drawTableRow(
          tahCols,
          [fmtDate(t.tahsilat_tarihi), fmtNum(t.tutar), t.aciklama || '—'],
          8
        );
      });
    }

    layout.moveDown(8);
    layout.drawSummaryBox(
      [
        ['Toplam Alış (Borç)', fmtTL(ozet.toplam_alis)],
        ['To Pay Ödemeler', fmtTL(ozet.to_pay_odeme)],
        ['Bilet Hesap Tahsilat', fmtTL(ozet.bilet_hesap_tahsilat)],
        ['Toplam Tahsilat', fmtTL(ozet.toplam_tahsilat)],
        ['Kalan Alacak', fmtTL(ozet.kalan_alacak)],
      ],
      `Toplam ${ozet.bilet_sayisi} bilet · ${ozet.toplam_kisi} kişi`
    );

    doc.end();
  });
}

module.exports = { generateAcentaDokumPdf };
