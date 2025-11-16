import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeethChartComponent } from '../teeth-chart/teeth-chart.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, TeethChartComponent],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  @Output() pathologyClick = new EventEmitter<void>();
  onPathologyClick() { this.pathologyClick.emit(); }
}