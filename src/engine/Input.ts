/**
 * Input handling system for mouse/touch
 */

import { InputState, Vector2 } from '../types';
import { Vec2 } from '../utils/math';

export class Input {
  private canvas: HTMLCanvasElement;
  private state: InputState;
  private pixelsPerUnit: number;

  constructor(canvas: HTMLCanvasElement, pixelsPerUnit: number) {
    this.canvas = canvas;
    this.pixelsPerUnit = pixelsPerUnit;
    this.state = {
      mousePosition: Vec2.zero(),
      isMouseDown: false,
      dragStart: null,
      dragCurrent: null,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getMousePosition(e: MouseEvent): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: ((e.clientX - rect.left) * scaleX) / this.pixelsPerUnit,
      y: ((e.clientY - rect.top) * scaleY) / this.pixelsPerUnit,
    };
  }

  private getTouchPosition(touch: Touch): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: ((touch.clientX - rect.left) * scaleX) / this.pixelsPerUnit,
      y: ((touch.clientY - rect.top) * scaleY) / this.pixelsPerUnit,
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only left click
    
    const pos = this.getMousePosition(e);
    this.state.isMouseDown = true;
    this.state.dragStart = pos;
    this.state.dragCurrent = pos;
    this.state.mousePosition = pos;
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePosition(e);
    this.state.mousePosition = pos;
    
    if (this.state.isMouseDown) {
      this.state.dragCurrent = pos;
    }
  }

  private handleMouseUp(_e: MouseEvent): void {
    this.state.isMouseDown = false;
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const pos = this.getTouchPosition(e.touches[0]);
      this.state.isMouseDown = true;
      this.state.dragStart = pos;
      this.state.dragCurrent = pos;
      this.state.mousePosition = pos;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const pos = this.getTouchPosition(e.touches[0]);
      this.state.mousePosition = pos;
      
      if (this.state.isMouseDown) {
        this.state.dragCurrent = pos;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.state.isMouseDown = false;
  }

  getState(): InputState {
    return this.state;
  }

  getDragVector(): Vector2 | null {
    if (this.state.dragStart && this.state.dragCurrent) {
      return Vec2.sub(this.state.dragCurrent, this.state.dragStart);
    }
    return null;
  }

  consumeDrag(): { start: Vector2; end: Vector2; vector: Vector2 } | null {
    if (this.state.dragStart && this.state.dragCurrent && !this.state.isMouseDown) {
      const result = {
        start: Vec2.copy(this.state.dragStart),
        end: Vec2.copy(this.state.dragCurrent),
        vector: Vec2.sub(this.state.dragCurrent, this.state.dragStart),
      };
      this.state.dragStart = null;
      this.state.dragCurrent = null;
      return result;
    }
    return null;
  }

  clearDrag(): void {
    this.state.dragStart = null;
    this.state.dragCurrent = null;
    this.state.isMouseDown = false;
  }
}
