import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PacienteService } from '../../services/paciente.service';
import { FamiliarService } from '../../services/familiar.service';
import { CreatePacienteDto, Paciente, CreateFamiliarDto } from '../../services/paciente.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface FamiliarForm {
  nombre: string;
  parentesco: string;
  celular: string;
}

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class PacientesComponent implements OnInit {
  pacienteForm!: FormGroup;
  pacientes: Paciente[] = [];
  editMode = false;
  isLoading = false;
  currentPacienteId: number | null = null;
  parentescos = ['Padre', 'Madre', 'Hermano/a', 'Hijo/a', 'Tío/a', 'Abuelo/a', 'Otro'];
  searchQuery: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private pacienteService: PacienteService,
    private familiarService: FamiliarService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadPacientes();
    this.setupAgeCalculation();
  }

  private initForm() {
    this.pacienteForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      fecha_nacimiento: ['', Validators.required],
      edad: [{ value: '', disabled: true }],
      ocupacion: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.maxLength(20)]],
      celular: ['', [Validators.required, Validators.maxLength(20)]],
      familiares: this.formBuilder.array([])
    });
  }

  private setupAgeCalculation() {
    this.pacienteForm.get('fecha_nacimiento')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        const birthDate = new Date(fecha);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        this.pacienteForm.patchValue({ edad: age }, { emitEvent: false });
      }
    });
  }

  get familiares() {
    return this.pacienteForm.get('familiares') as FormArray;
  }

  addFamiliar() {
    const familiarGroup = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      parentesco: ['', Validators.required],
      celular: ['', [Validators.required, Validators.maxLength(20)]]
    });

    this.familiares.push(familiarGroup);
  }

  removeFamiliar(index: number) {
    this.familiares.removeAt(index);
  }

  searchPacientes() {
    if (!this.searchQuery.trim()) {
      this.loadPacientes();
      return;
    }

    this.isLoading = true;
    this.pacienteService.search(this.searchQuery.trim())
      .subscribe({
        next: (response) => {
          this.pacientes = response.data;
          if (response.data.length === 0) {
            this.toastr.info('No se encontraron pacientes');
          }
        },
        error: (error) => {
          this.toastr.error('Error al buscar pacientes');
          console.error('Error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadPacientes();
  }

  onSubmit() {
    if (this.pacienteForm.valid) {
      this.isLoading = true;
      
      const formValues = this.pacienteForm.getRawValue();
      
      const pacienteData: CreatePacienteDto = {
        nombre: formValues.nombre,
        fecha_nacimiento: new Date(formValues.fecha_nacimiento),
        edad: formValues.edad,
        estado_civil_id: 1,
        ocupacion: formValues.ocupacion,
        telefono: formValues.telefono,
        celular: formValues.celular
      };

      if (this.editMode && this.currentPacienteId) {
        this.pacienteService.update(this.currentPacienteId, pacienteData)
          .subscribe({
            next: () => {
              this.toastr.success('Paciente actualizado exitosamente');
              this.resetForm();
              this.loadPacientes();
            },
            error: (error) => {
              this.toastr.error('Error al actualizar el paciente');
              console.error('Error:', error);
            },
            complete: () => {
              this.isLoading = false;
            }
          });
      } else {
        this.pacienteService.create(pacienteData)
          .subscribe({
            next: (paciente) => {
              if (formValues.familiares && formValues.familiares.length > 0) {
                const familiaresObservables = formValues.familiares.map((familiar: FamiliarForm) => {
                  const familiarData: CreateFamiliarDto = {
                    paciente_id: paciente.id,
                    nombre: familiar.nombre,
                    parentesco: this.mapParentesco(familiar.parentesco),
                    celular: familiar.celular
                  };
                  return this.familiarService.create(familiarData);
                });

                forkJoin(familiaresObservables).subscribe({
                  next: () => {
                    this.toastr.success('Paciente y familiares registrados exitosamente');
                    this.resetForm();
                    this.loadPacientes();
                  },
                  error: (error) => {
                    this.toastr.error('Error al registrar los familiares');
                    console.error('Error:', error);
                  },
                  complete: () => {
                    this.isLoading = false;
                  }
                });
              } else {
                this.toastr.success('Paciente registrado exitosamente');
                this.resetForm();
                this.loadPacientes();
                this.isLoading = false;
              }
            },
            error: (error) => {
              this.toastr.error('Error al registrar el paciente');
              console.error('Error:', error);
              this.isLoading = false;
            }
          });
      }
    } else {
      Object.keys(this.pacienteForm.controls).forEach(key => {
        const control = this.pacienteForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  private mapParentesco(parentesco: string): 'madre' | 'padre' | 'tutor' {
    switch (parentesco.toLowerCase()) {
      case 'madre':
        return 'madre';
      case 'padre':
        return 'padre';
      default:
        return 'tutor';
    }
  }

  private loadPacientes() {
    this.pacienteService.getAll().subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
      },
      error: (error) => {
        this.toastr.error('Error al cargar los pacientes');
        console.error('Error:', error);
      }
    });
  }

  editPaciente(paciente: Paciente) {
    this.editMode = true;
    this.currentPacienteId = paciente.id;
    
    while (this.familiares.length) {
      this.familiares.removeAt(0);
    }

    const fechaNacimiento = new Date(paciente.fecha_nacimiento);
    const fechaFormateada = fechaNacimiento.toISOString().split('T')[0];

    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      fecha_nacimiento: fechaFormateada,
      edad: paciente.edad,
      ocupacion: paciente.ocupacion,
      telefono: paciente.telefono,
      celular: paciente.celular
    });

    if (paciente.familiares) {
      paciente.familiares.forEach(familiar => {
        const familiarGroup = this.formBuilder.group({
          nombre: [familiar.nombre, [Validators.required, Validators.maxLength(100)]],
          parentesco: [familiar.parentesco, Validators.required],
          celular: [familiar.celular, [Validators.required, Validators.maxLength(20)]]
        });
        this.familiares.push(familiarGroup);
      });
    }
  }

  deletePaciente(id: number) {
    if (confirm('¿Está seguro de eliminar este paciente?')) {
      this.pacienteService.delete(id).subscribe({
        next: () => {
          this.toastr.success('Paciente eliminado exitosamente');
          this.loadPacientes();
        },
        error: (error) => {
          this.toastr.error('Error al eliminar el paciente');
          console.error('Error:', error);
        }
      });
    }
  }

  resetForm() {
    this.editMode = false;
    this.currentPacienteId = null;
    this.pacienteForm.reset();
    while (this.familiares.length) {
      this.familiares.removeAt(0);
    }
  }

  goToDetail(paciente: Paciente) {
    this.router.navigate(['/paciente-detail', paciente.id]);
  }
}