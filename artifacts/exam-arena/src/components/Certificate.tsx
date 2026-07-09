import { useEffect, useRef } from 'react';
import { Download, Award } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  subject: string;
  year: string;
  week: number;
  weekTopic: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export function Certificate({
  studentName,
  subject,
  year,
  week,
  weekTopic,
  score,
  total,
  percentage,
  completedAt,
}: CertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 900;
    const H = 636;
    canvas.width = W;
    canvas.height = H;

    // ── Deep dark background ──────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0b14');
    bg.addColorStop(0.5, '#0f1020');
    bg.addColorStop(1, '#0a0b14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Outer ornate border ───────────────────────────────────────────────────
    const drawBorderRect = (x: number, y: number, w: number, h: number, r: number, color: string, lineW: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.stroke();
      ctx.restore();
    };

    drawBorderRect(12, 12, W - 24, H - 24, 20, 'rgba(255,170,0,0.9)', 3.5);
    drawBorderRect(22, 22, W - 44, H - 44, 16, 'rgba(255,170,0,0.35)', 1);
    drawBorderRect(28, 28, W - 56, H - 56, 14, 'rgba(255,170,0,0.15)', 0.5);

    // ── Corner ornaments ──────────────────────────────────────────────────────
    const corners = [[35, 35], [W - 35, 35], [35, H - 35], [W - 35, H - 35]];
    corners.forEach(([cx, cy]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(255,170,0,0.7)';
      ctx.lineWidth = 1.5;
      // Diamond
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(12, 0); ctx.lineTo(0, 12); ctx.lineTo(-12, 0); ctx.closePath();
      ctx.stroke();
      // Center dot
      ctx.fillStyle = 'rgba(255,170,0,0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Top glow header band ──────────────────────────────────────────────────
    const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
    headerGrad.addColorStop(0, 'rgba(255,107,0,0)');
    headerGrad.addColorStop(0.3, 'rgba(255,107,0,0.12)');
    headerGrad.addColorStop(0.5, 'rgba(255,107,0,0.18)');
    headerGrad.addColorStop(0.7, 'rgba(255,107,0,0.12)');
    headerGrad.addColorStop(1, 'rgba(255,107,0,0)');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 40, W, 120);

    // ── Seal circle (left) ────────────────────────────────────────────────────
    const sealX = 110, sealY = 310;
    const sealGrad = ctx.createRadialGradient(sealX, sealY, 0, sealX, sealY, 68);
    sealGrad.addColorStop(0, 'rgba(255,140,0,0.25)');
    sealGrad.addColorStop(0.6, 'rgba(255,107,0,0.15)');
    sealGrad.addColorStop(1, 'rgba(255,80,0,0.05)');
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 68, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,170,0,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,170,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 58, 0, Math.PI * 2);
    ctx.stroke();

    // Star burst in seal
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const inner = 30, outer = 52;
      ctx.save();
      ctx.translate(sealX, sealY);
      ctx.rotate(angle);
      ctx.strokeStyle = `rgba(255,170,0,${i % 2 === 0 ? 0.5 : 0.2})`;
      ctx.lineWidth = i % 2 === 0 ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, inner);
      ctx.lineTo(0, outer);
      ctx.stroke();
      ctx.restore();
    }

    // Star icon in seal
    ctx.save();
    ctx.translate(sealX, sealY - 8);
    ctx.fillStyle = 'rgba(255,170,0,0.9)';
    const starPoints = 5;
    ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
      const r = i % 2 === 0 ? 20 : 10;
      const a = (i / (starPoints * 2)) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,170,0,0.8)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFIED', sealX, sealY + 30);
    ctx.fillText('ACHIEVER', sealX, sealY + 42);

    // ── Mirror seal (right) ───────────────────────────────────────────────────
    const sealX2 = W - 110;
    const sealGrad2 = ctx.createRadialGradient(sealX2, sealY, 0, sealX2, sealY, 68);
    sealGrad2.addColorStop(0, 'rgba(0,229,204,0.15)');
    sealGrad2.addColorStop(1, 'rgba(0,229,204,0.02)');
    ctx.fillStyle = sealGrad2;
    ctx.beginPath();
    ctx.arc(sealX2, sealY, 68, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,229,204,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sealX2, sealY, 68, 0, Math.PI * 2);
    ctx.stroke();

    // Score badge in right seal
    ctx.fillStyle = 'rgba(0,229,204,0.9)';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${percentage}%`, sealX2, sealY + 10);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = 'rgba(0,229,204,0.65)';
    ctx.fillText('SCORE', sealX2, sealY + 28);
    ctx.fillText(`${score}/${total} CORRECT`, sealX2, sealY + 40);

    // ── Divider lines ─────────────────────────────────────────────────────────
    const divX1 = 195, divX2 = W - 195;
    const lineGrad = ctx.createLinearGradient(divX1, 0, divX2, 0);
    lineGrad.addColorStop(0, 'rgba(255,170,0,0)');
    lineGrad.addColorStop(0.2, 'rgba(255,170,0,0.6)');
    lineGrad.addColorStop(0.8, 'rgba(255,170,0,0.6)');
    lineGrad.addColorStop(1, 'rgba(255,170,0,0)');

    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(divX1, 155); ctx.lineTo(divX2, 155);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(divX1, 505); ctx.lineTo(divX2, 505);
    ctx.stroke();

    // ── "CERTIFICATE OF ACHIEVEMENT" title ────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,170,0,0.55)';
    ctx.font = '500 13px sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', W / 2, 88);
    ctx.letterSpacing = '0px';

    // Decorative dots beside title
    const titleDotY = 82;
    [-220, -205, 205, 220].forEach(dx => {
      ctx.fillStyle = 'rgba(255,170,0,0.4)';
      ctx.beginPath();
      ctx.arc(W / 2 + dx, titleDotY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── QUIZ BUNKER brand ─────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = 'bold 11px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('QUIZ BUNKER', W / 2, 118);
    ctx.letterSpacing = '0px';

    // ── "This is to certify that" ─────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillText('This is to certify that', W / 2, 200);

    // ── Student Name ──────────────────────────────────────────────────────────
    const nameGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    nameGrad.addColorStop(0, '#ffaa00');
    nameGrad.addColorStop(0.5, '#ffffff');
    nameGrad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = nameGrad;
    ctx.font = `bold ${studentName.length > 20 ? 36 : 44}px Georgia, serif`;
    ctx.fillText(studentName, W / 2, 262);

    // Underline name
    const nameWidth = ctx.measureText(studentName).width;
    const nameGradLine = ctx.createLinearGradient(W / 2 - nameWidth / 2, 0, W / 2 + nameWidth / 2, 0);
    nameGradLine.addColorStop(0, 'rgba(255,170,0,0)');
    nameGradLine.addColorStop(0.5, 'rgba(255,170,0,0.7)');
    nameGradLine.addColorStop(1, 'rgba(255,170,0,0)');
    ctx.strokeStyle = nameGradLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameWidth / 2, 272);
    ctx.lineTo(W / 2 + nameWidth / 2, 272);
    ctx.stroke();

    // ── "has successfully completed" ─────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillText('has successfully completed', W / 2, 310);

    // ── Subject + Year pill ───────────────────────────────────────────────────
    const pill = { y: 330, h: 52, rx: 12 };
    const pillW = Math.min(500, W - 220);
    const pillX = W / 2 - pillW / 2;

    const pillGrad = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);
    pillGrad.addColorStop(0, 'rgba(255,107,0,0.05)');
    pillGrad.addColorStop(0.5, 'rgba(255,107,0,0.2)');
    pillGrad.addColorStop(1, 'rgba(255,107,0,0.05)');
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(pillX, pill.y, pillW, pill.h, pill.rx);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,107,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pillX, pill.y, pillW, pill.h, pill.rx);
    ctx.stroke();

    ctx.fillStyle = '#ff8c42';
    ctx.font = `bold ${subject.length > 25 ? 16 : 20}px sans-serif`;
    ctx.fillText(`${subject}  ·  ${year}`, W / 2, pill.y + 34);

    // ── Week + Topic ──────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Week ${week}${weekTopic ? ` — ${weekTopic}` : ''}`, W / 2, 412);

    // ── Date row ──────────────────────────────────────────────────────────────
    const dateStr = new Date(completedAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Completed on ${dateStr}`, W / 2, 446);

    // ── Bottom signature area ─────────────────────────────────────────────────
    // Left: Director signature line
    const sigY = 555;
    ctx.strokeStyle = 'rgba(255,170,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, sigY); ctx.lineTo(380, sigY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Quiz Bunker Director', 290, sigY + 16);

    // Right: Score validation
    ctx.strokeStyle = 'rgba(0,229,204,0.4)';
    ctx.beginPath();
    ctx.moveTo(520, sigY); ctx.lineTo(700, sigY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('Academic Score Validated', 610, sigY + 16);

    // Center: Badge
    const badgeGrad = ctx.createRadialGradient(W / 2, sigY - 10, 0, W / 2, sigY - 10, 24);
    badgeGrad.addColorStop(0, 'rgba(255,140,0,0.3)');
    badgeGrad.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.arc(W / 2, sigY - 10, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,170,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(W / 2, sigY - 10, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Check mark
    ctx.strokeStyle = 'rgba(255,170,0,0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 8, sigY - 10);
    ctx.lineTo(W / 2 - 2, sigY - 4);
    ctx.lineTo(W / 2 + 9, sigY - 18);
    ctx.stroke();

    // ── Subtle watermark grid ─────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,170,0,0.015)';
    ctx.font = '10px sans-serif';
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 10; col++) {
        ctx.save();
        ctx.translate(60 + col * 90, 80 + row * 80);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText('QUIZ BUNKER', 0, 0);
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    draw();
  }, [studentName, subject, year, week, weekTopic, score, total, percentage, completedAt]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `QuizBunker-Certificate-${studentName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="mt-6">
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-3">
        <Award className="w-5 h-5 text-accent shrink-0" />
        <h2 className="font-display text-white text-base uppercase">Certificate of Achievement</h2>
      </div>

      {/* Canvas wrapper — scroll horizontally on small screens */}
      <div className="card-game p-3 overflow-x-auto">
        <canvas
          ref={canvasRef}
          className="block rounded-xl mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="btn-game w-full py-3 text-sm justify-center mt-3 flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download Certificate
      </button>
    </div>
  );
}
