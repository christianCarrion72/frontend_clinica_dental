import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PacientesComponent } from './pacientes.component';

@NgModule({
  declarations: [
    PacientesComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', component: PacientesComponent }
    ])
  ]
})
export class PacientesModule { }