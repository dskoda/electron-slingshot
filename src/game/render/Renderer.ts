/**
 * Canvas rendering system
 */

import { Vector2, FieldSource, GameConfig, RenderOptions } from '../../types';
import { Vec2 } from '../../utils/math';
import { generateFieldGrid, evaluateFields } from '../../physics/Fields';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private fieldGridCache: { position: Vector2; field: Vector2 }[] | null = null;
  private currentLevelId: number = -1;

  constructor(ctx: CanvasRenderingContext2D, config: GameConfig) {
    this.ctx = ctx;
    this.config = config;
  }

  /**
   * Convert world coordinates to canvas pixels
   */
  private toPixel(world: Vector2): { x: number; y: number } {
    return {
      x: world.x * this.config.pixelsPerUnit,
      y: world.y * this.config.pixelsPerUnit,
    };
  }

  /**
   * Convert world units to pixels
   */
  private toPixelSize(worldSize: number): number {
    return worldSize * this.config.pixelsPerUnit;
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
  }

  /**
   * Draw the background grid
   */
  drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.config.worldWidth; x++) {
      const px = x * this.config.pixelsPerUnit;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, this.config.canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.config.worldHeight; y++) {
      const py = y * this.config.pixelsPerUnit;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(this.config.canvasWidth, py);
      ctx.stroke();
    }
  }

  /**
   * Draw the launch point indicator
   */
  drawLaunchPoint(position: Vector2): void {
    const ctx = this.ctx;
    const px = this.toPixel(position);

    // Outer glow
    const gradient = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, 30);
    gradient.addColorStop(0, 'rgba(0, 200, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px.x, px.y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.fillStyle = '#00c8ff';
    ctx.beginPath();
    ctx.arc(px.x, px.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Electron symbol
    ctx.fillStyle = '#0a0a1a';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('e⁻', px.x, px.y);
  }

  /**
   * Draw the target
   */
  drawTarget(x: number, y: number, radius: number): void {
    const ctx = this.ctx;
    const px = this.toPixel({ x, y });
    const pr = this.toPixelSize(radius);

    // Outer glow
    const gradient = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, pr * 1.5);
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
    gradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px.x, px.y, pr * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Target circle
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px.x, px.y, pr, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rings
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px.x, px.y, pr * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px.x, px.y, pr * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(px.x, px.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw a point charge
   */
  drawPointCharge(position: Vector2, charge: number): void {
    const ctx = this.ctx;
    const px = this.toPixel(position);
    const size = Math.min(25, 15 + Math.abs(charge) * 3);

    // Glow
    const color = charge > 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 100, 255, 0.3)';
    const gradient = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, size * 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px.x, px.y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Circle
    ctx.fillStyle = charge > 0 ? '#ff6666' : '#6666ff';
    ctx.beginPath();
    ctx.arc(px.x, px.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Symbol
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(charge > 0 ? '+' : '−', px.x, px.y);
  }

  /**
   * Draw a magnetic field region
   */
  drawMagneticRegion(x: number, y: number, width: number, height: number, Bz: number): void {
    const ctx = this.ctx;
    const px = this.toPixel({ x, y });
    const pw = this.toPixelSize(width);
    const ph = this.toPixelSize(height);

    // Fill
    ctx.fillStyle = Bz > 0 ? 'rgba(180, 100, 255, 0.15)' : 'rgba(255, 180, 100, 0.15)';
    ctx.fillRect(px.x, px.y, pw, ph);

    // Border
    ctx.strokeStyle = Bz > 0 ? 'rgba(180, 100, 255, 0.5)' : 'rgba(255, 180, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(px.x, px.y, pw, ph);
    ctx.setLineDash([]);

    // Draw B-field symbols (dots for out of page, crosses for into page)
    const spacing = 40;
    ctx.fillStyle = Bz > 0 ? '#b464ff' : '#ffb464';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let bx = px.x + spacing; bx < px.x + pw - spacing/2; bx += spacing) {
      for (let by = px.y + spacing; by < px.y + ph - spacing/2; by += spacing) {
        if (Bz > 0) {
          // Out of page - dot
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Into page - cross
          ctx.fillText('×', bx, by);
        }
      }
    }

    // Label
    ctx.fillStyle = Bz > 0 ? '#b464ff' : '#ffb464';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`B ${Bz > 0 ? '⊙' : '⊗'}`, px.x + 5, px.y + 5);
  }

  /**
   * Draw uniform E-field region
   */
  drawUniformEField(field: Vector2, region?: { x: number; y: number; width: number; height: number }): void {
    const ctx = this.ctx;
    
    let x = 0, y = 0, width = this.config.worldWidth, height = this.config.worldHeight;
    if (region) {
      x = region.x;
      y = region.y;
      width = region.width;
      height = region.height;
    }

    const px = this.toPixel({ x, y });
    const pw = this.toPixelSize(width);
    const ph = this.toPixelSize(height);

    // Subtle fill
    ctx.fillStyle = 'rgba(255, 255, 100, 0.05)';
    ctx.fillRect(px.x, px.y, pw, ph);

    // Draw field direction arrows
    const spacing = 60;
    const arrowLength = 20;
    const fieldAngle = Vec2.angle(field);
    
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.4)';
    ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
    ctx.lineWidth = 2;

    for (let ax = px.x + spacing/2; ax < px.x + pw; ax += spacing) {
      for (let ay = px.y + spacing/2; ay < px.y + ph; ay += spacing) {
        this.drawArrow(ax, ay, fieldAngle, arrowLength);
      }
    }
  }

  /**
   * Draw line charge
   */
  drawLineCharge(start: Vector2, end: Vector2, chargeDensity: number): void {
    const ctx = this.ctx;
    const pStart = this.toPixel(start);
    const pEnd = this.toPixel(end);

    // Glow
    ctx.strokeStyle = chargeDensity > 0 
      ? 'rgba(255, 100, 100, 0.3)' 
      : 'rgba(100, 100, 255, 0.3)';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();

    // Main line
    ctx.strokeStyle = chargeDensity > 0 ? '#ff6666' : '#6666ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();

    // Charge symbols along the line
    const segments = 5;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = pStart.x + (pEnd.x - pStart.x) * t;
      const py = pStart.y + (pEnd.y - pStart.y) * t;
      
      ctx.fillStyle = chargeDensity > 0 ? '#ff6666' : '#6666ff';
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.fillText(chargeDensity > 0 ? '+' : '−', px, py);
    }
  }

  /**
   * Draw all field sources
   */
  drawFieldSources(sources: FieldSource[]): void {
    for (const source of sources) {
      switch (source.type) {
        case 'point_charge':
          this.drawPointCharge(source.position, source.charge);
          break;
        case 'uniform_E':
          this.drawUniformEField(source.field, source.region);
          break;
        case 'B_region':
          this.drawMagneticRegion(
            source.region.x,
            source.region.y,
            source.region.width,
            source.region.height,
            source.Bz
          );
          break;
        case 'line_charge':
          this.drawLineCharge(source.start, source.end, source.chargeDensity);
          break;
        case 'dipole':
          this.drawPointCharge(source.positive, source.charge);
          this.drawPointCharge(source.negative, -source.charge);
          break;
      }
    }
  }

  /**
   * Draw the electron
   */
  drawElectron(position: Vector2, trail: Vector2[]): void {
    const ctx = this.ctx;

    // Draw trail
    if (trail.length > 1) {
      ctx.beginPath();
      const start = this.toPixel(trail[0]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < trail.length; i++) {
        const pt = this.toPixel(trail[i]);
        ctx.lineTo(pt.x, pt.y);
      }

      // Gradient trail
      const gradient = ctx.createLinearGradient(
        this.toPixel(trail[0]).x,
        this.toPixel(trail[0]).y,
        this.toPixel(trail[trail.length - 1]).x,
        this.toPixel(trail[trail.length - 1]).y
      );
      gradient.addColorStop(0, 'rgba(0, 200, 255, 0)');
      gradient.addColorStop(1, 'rgba(0, 200, 255, 0.8)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw electron
    const px = this.toPixel(position);
    const radius = this.toPixelSize(this.config.electronRadius);

    // Glow
    const glowGradient = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, radius * 3);
    glowGradient.addColorStop(0, 'rgba(0, 200, 255, 0.5)');
    glowGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(px.x, px.y, radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#00c8ff';
    ctx.beginPath();
    ctx.arc(px.x, px.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px.x - radius * 0.3, px.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw aiming vector
   */
  drawAimingVector(launchPoint: Vector2, dragVector: Vector2): void {
    const ctx = this.ctx;
    const pLaunch = this.toPixel(launchPoint);
    
    // Direct velocity: launch in the direction of the drag
    const launchVelocity = Vec2.scale(dragVector, this.config.launchSpeedScale);
    const clampedVelocity = Vec2.clampLength(launchVelocity, this.config.maxLaunchSpeed);
    
    // Calculate speed and angle for arrow drawing
    const speed = Vec2.length(clampedVelocity);
    const angle = Vec2.angle(clampedVelocity);
    
    // Full length arrow showing actual velocity
    const endPoint = Vec2.add(launchPoint, clampedVelocity);
    const pEnd = this.toPixel(endPoint);

    // Draw dashed line
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(pLaunch.x, pLaunch.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrowhead
    if (speed > 0.1) {
      this.drawArrowhead(pEnd.x, pEnd.y, angle, 15);
    }
  }

  /**
   * Draw trajectory preview
   */
  drawTrajectoryPreview(trajectory: Vector2[]): void {
    if (trajectory.length < 2) return;

    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 10]);

    ctx.beginPath();
    const start = this.toPixel(trajectory[0]);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < trajectory.length; i++) {
      const pt = this.toPixel(trajectory[i]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw field vectors on a grid
   */
  drawFieldVectors(sources: FieldSource[], options: RenderOptions, levelId: number): void {
    // Cache field grid for performance
    if (this.currentLevelId !== levelId || !this.fieldGridCache) {
      this.fieldGridCache = generateFieldGrid(sources, this.config, options.fieldGridSpacing);
      this.currentLevelId = levelId;
    }

    const ctx = this.ctx;

    for (const point of this.fieldGridCache) {
      const px = this.toPixel(point.position);
      const magnitude = Vec2.length(point.field);
      
      // Scale arrow length based on field magnitude (with limits)
      const arrowLength = Math.min(25, Math.max(8, Math.log(magnitude + 1) * 8));
      const angle = Vec2.angle(point.field);

      // Color based on magnitude
      const intensity = Math.min(1, magnitude / 10);
      ctx.strokeStyle = `rgba(255, ${Math.round(255 * (1 - intensity))}, ${Math.round(100 * (1 - intensity))}, 0.6)`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1.5;

      this.drawArrow(px.x, px.y, angle, arrowLength);
    }
  }

  /**
   * Draw force vector on electron
   */
  drawForceVector(position: Vector2, sources: FieldSource[]): void {
    const ctx = this.ctx;
    const { E, B } = evaluateFields(position, sources, this.config);
    
    // Simple visualization - just show E field direction at electron position
    const px = this.toPixel(position);
    const magnitude = Vec2.length(E);
    
    if (magnitude > 0.1) {
      const angle = Vec2.angle(E);
      const arrowLength = Math.min(40, magnitude * 5);
      
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
      ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
      ctx.lineWidth = 2;
      
      this.drawArrow(px.x, px.y, angle, arrowLength);
    }

    // Show B indicator if present
    if (Math.abs(B) > 0.1) {
      ctx.fillStyle = '#b464ff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(B > 0 ? 'B⊙' : 'B⊗', px.x, px.y - 25);
    }
  }

  /**
   * Helper to draw an arrow
   */
  private drawArrow(x: number, y: number, angle: number, length: number): void {
    const ctx = this.ctx;
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    this.drawArrowhead(endX, endY, angle, length * 0.4);
  }

  /**
   * Helper to draw arrowhead
   */
  private drawArrowhead(x: number, y: number, angle: number, size: number): void {
    const ctx = this.ctx;
    const headAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - Math.cos(angle - headAngle) * size,
      y - Math.sin(angle - headAngle) * size
    );
    ctx.lineTo(
      x - Math.cos(angle + headAngle) * size,
      y - Math.sin(angle + headAngle) * size
    );
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Clear field cache (call when level changes)
   */
  clearFieldCache(): void {
    this.fieldGridCache = null;
  }

  /**
   * Calculate aiming info for HUD display
   */
  getAimingInfo(dragVector: Vector2): { speedPercent: number; angleDegrees: number } {
    const launchVelocity = Vec2.scale(dragVector, this.config.launchSpeedScale);
    const clampedVelocity = Vec2.clampLength(launchVelocity, this.config.maxLaunchSpeed);
    
    const speed = Vec2.length(clampedVelocity);
    const maxSpeed = this.config.maxLaunchSpeed;
    const speedPercent = Math.round((speed / maxSpeed) * 100);
    const angle = Vec2.angle(clampedVelocity);
    let angleDegrees = Math.round((-angle * 180) / Math.PI);
    if (angleDegrees < 0) angleDegrees += 360;
    
    return { speedPercent, angleDegrees };
  }

  /**
   * Draw instruction message (for level 1)
   */
  drawInstructionMessage(message: string): void {
    const ctx = this.ctx;
    const centerX = this.config.canvasWidth / 2;
    const centerY = this.config.canvasHeight / 2 - 150;

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.7)';
    ctx.fillRect(0, centerY - 60, this.config.canvasWidth, 120);

    // Draw the message with large font
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, centerX, centerY);

    // Add a subtle glow effect
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.fillText(message, centerX, centerY);
    ctx.shadowBlur = 0;
  }
}
