import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {EmployeeManagerComponent} from './employee';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EmployeeManagerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cadastro-faciais-i9');
}
