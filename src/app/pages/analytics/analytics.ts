import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { TelegramService } from '../../services/telegram.service';
import { BackButtonComponent } from '../../components/back-button/back-button';
import { environment } from '../../../environments/environment';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, annotationPlugin);

interface AnalyticsData {
  hourly: { t: string; tokens: number; spend: number; calls: number }[];
  daily: { t: string; tokens: number; spend: number; calls: number }[];
  monthly: { t: string; tokens: number; spend: number; calls: number }[];
  limits: {
    dailyCap: number;
    weeklyCap: number;
    monthlyCap: number;
    rpmLimit: number;
    tpmLimit: number;
  };
  tier: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AnalyticsPage implements OnInit, OnDestroy {
  private chat = inject(ChatService);
  private tg = inject(TelegramService);
  private router = inject(Router);

  @ViewChild('hourlyChart') hourlyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyChart') dailyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart') monthlyCanvas!: ElementRef<HTMLCanvasElement>;

  loading = signal(true);
  error = signal('');
  data = signal<AnalyticsData | null>(null);

  private charts: Chart[] = [];

  ngOnInit() {
    this.tg.showBackButton(() => this.router.navigate(['/']));
    this.fetchData();
  }

  ngOnDestroy() {
    this.tg.hideBackButton();
    this.charts.forEach(c => c.destroy());
  }

  private async fetchData() {
    const token = this.chat['sessionToken'];
    if (!token) {
      this.error.set('Not authenticated');
      this.loading.set(false);
      return;
    }

    try {
      const res = await fetch(`${environment.routerUrl}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AnalyticsData = await res.json();
      this.data.set(json);
      this.loading.set(false);
      // Wait for DOM to render canvases
      setTimeout(() => this.renderCharts(json), 0);
    } catch (e: any) {
      this.error.set(e.message || 'Failed to load analytics');
      this.loading.set(false);
    }
  }

  private renderCharts(data: AnalyticsData) {
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--tg-theme-text-color').trim() || '#333';
    const hintColor = style.getPropertyValue('--tg-theme-hint-color').trim() || '#999';
    const accentColor = style.getPropertyValue('--tg-theme-button-color').trim() || '#3b82f6';
    const gridColor = 'rgba(128, 128, 128, 0.12)';
    const capColor = '#ef4444';

    // Hourly chart (last 16h)
    if (this.hourlyCanvas) {
      const labels = data.hourly.map(d => {
        const dt = new Date(d.t);
        return dt.getHours().toString().padStart(2, '0') + ':00';
      });
      this.charts.push(this.createBarChart(
        this.hourlyCanvas.nativeElement, labels,
        data.hourly.map(d => d.spend),
        data.limits.dailyCap, 'Daily Cap',
        accentColor, textColor, hintColor, gridColor, capColor,
      ));
    }

    // Daily chart (last 7d)
    if (this.dailyCanvas) {
      const labels = data.daily.map(d => {
        const dt = new Date(d.t);
        return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      });
      this.charts.push(this.createBarChart(
        this.dailyCanvas.nativeElement, labels,
        data.daily.map(d => d.spend),
        data.limits.weeklyCap, 'Weekly Cap',
        accentColor, textColor, hintColor, gridColor, capColor,
      ));
    }

    // Monthly chart (last 12mo)
    if (this.monthlyCanvas) {
      const labels = data.monthly.map(d => {
        const dt = new Date(d.t);
        return dt.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      });
      this.charts.push(this.createBarChart(
        this.monthlyCanvas.nativeElement, labels,
        data.monthly.map(d => d.spend),
        data.limits.monthlyCap, 'Monthly Cap',
        accentColor, textColor, hintColor, gridColor, capColor,
      ));
    }
  }

  private createBarChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    spendData: number[],
    capValue: number,
    capLabel: string,
    barColor: string,
    textColor: string,
    hintColor: string,
    gridColor: string,
    capColor: string,
  ): Chart {
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Spend ($)',
          data: spendData,
          backgroundColor: barColor + 'cc',
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: textColor, boxWidth: 12, padding: 12 } },
          tooltip: {
            callbacks: {
              label: (ctx) => `$${(ctx.parsed.y ?? 0).toFixed(4)}`,
            },
          },
          annotation: {
            annotations: {
              capLine: {
                type: 'line',
                yMin: capValue,
                yMax: capValue,
                borderColor: capColor,
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: `${capLabel}: $${capValue}`,
                  position: 'end',
                  color: capColor,
                  font: { size: 11 },
                  backgroundColor: 'transparent',
                },
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: hintColor, font: { size: 11 } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: hintColor,
              font: { size: 11 },
              callback: (v) => '$' + v,
            },
            grid: { color: gridColor },
          },
        },
      },
    });
  }
}
