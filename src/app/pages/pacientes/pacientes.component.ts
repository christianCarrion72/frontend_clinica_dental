import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { PacienteService } from '../../services/paciente.service';
import { FamiliarService } from '../../services/familiar.service';
import { CreatePacienteDto, Paciente, CreateFamiliarDto } from '../../services/paciente.service';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
export class PacientesComponent implements OnInit, OnDestroy {
  pacienteForm!: FormGroup;
  pacientes: Paciente[] = [];
  filteredPacientes: Paciente[] = [];
  paginatedPacientes: Paciente[] = [];
  editMode = false;
  isLoading = false;
  isModalOpen = false;
  currentPacienteId: number | null = null;
  parentescos = ['Padre', 'Madre', 'Hermano/a', 'Hijo/a', 'Tío/a', 'Abuelo/a', 'Otro'];
  searchQuery: string = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  // Para búsqueda reactiva
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Helper para usar Math en template
  Math = Math;

  constructor(
    private formBuilder: FormBuilder,
    private pacienteService: PacienteService,
    private familiarService: FamiliarService,
    private toastr: ToastrService,
    private router: Router,
    private location: Location
  ) {
    this.initForm();
  }

  goBack() {
    this.location.back();
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit() {
    this.loadPacientes();
    this.setupAgeCalculation();
    this.setupReactiveSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupReactiveSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  private initForm() {
    this.pacienteForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      fecha_nacimiento: ['', Validators.required],
      edad: [{ value: '', disabled: true }],
      email: ['', [Validators.email, Validators.maxLength(100)]],
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

  onSearchChange(searchTerm: string) {
    this.searchQuery = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredPacientes = [...this.pacientes];
      this.updatePagination();
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredPacientes = this.pacientes.filter(paciente =>
      paciente.nombre.toLowerCase().includes(term) ||
      paciente.id.toString().includes(term) ||
      (paciente.celular && paciente.celular.toLowerCase().includes(term)) ||
      (paciente.ocupacion && paciente.ocupacion.toLowerCase().includes(term))
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  onSubmit() {
    if (this.pacienteForm.valid) {
      this.isLoading = true;

      const formValues = this.pacienteForm.getRawValue();

      const pacienteData: CreatePacienteDto = {
        nombre: formValues.nombre,
        fecha_nacimiento: new Date(formValues.fecha_nacimiento),
        edad: formValues.edad,
        email: formValues.email,
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
              this.closeModal();
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
        // Primero creamos el paciente
        this.pacienteService.create(pacienteData)
          .subscribe({
            next: (paciente) => {
              console.log('Paciente creado exitosamente con ID:', paciente.id);

              // Verificamos si hay familiares para crear
              if (formValues.familiares && formValues.familiares.length > 0) {
                console.log('Creando', formValues.familiares.length, 'familiar(es)...');

                // Creamos los familiares usando el ID del paciente recién creado
                const familiaresObservables = formValues.familiares.map((familiar: FamiliarForm) => {
                  const familiarData: CreateFamiliarDto = {
                    paciente_id: paciente.id,
                    nombre: familiar.nombre,
                    parentesco: this.mapParentesco(familiar.parentesco),
                    celular: familiar.celular
                  };
                  console.log('Creando familiar:', familiarData);
                  return this.familiarService.create(familiarData);
                });

                // Esperamos a que todos los familiares se creen
                forkJoin(familiaresObservables).subscribe({
                  next: (familiaresCreados) => {
                    console.log('Familiares creados exitosamente:', familiaresCreados);
                    this.toastr.success('Paciente y familiares registrados exitosamente');
                    this.closeModal();
                    this.loadPacientes();
                    this.isLoading = false;
                  },
                  error: (error) => {
                    console.error('Error al registrar los familiares:', error);
                    this.toastr.warning('Paciente registrado, pero hubo un error al registrar los familiares');
                    this.closeModal();
                    this.loadPacientes();
                    this.isLoading = false;
                  }
                });
              } else {
                // No hay familiares, solo confirmamos el registro del paciente
                console.log('No hay familiares para registrar');
                this.toastr.success('Paciente registrado exitosamente');
                this.closeModal();
                this.loadPacientes();
                this.isLoading = false;
              }
            },
            error: (error) => {
              console.error('Error al registrar el paciente:', error);
              this.toastr.error('Error al registrar el paciente');
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
    this.isLoading = true;
    this.pacienteService.getAll().subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
        this.filteredPacientes = [...pacientes];
        this.updatePagination();
      },
      error: (error) => {
        this.toastr.error('Error al cargar los pacientes');
        console.error('Error:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.filteredPacientes.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    this.updatePaginatedPacientes();
  }

  private updatePaginatedPacientes() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPacientes = this.filteredPacientes.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedPacientes();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedPacientes();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPacientes();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfWindow = Math.floor(maxPagesToShow / 2);
      let startPage = Math.max(1, this.currentPage - halfWindow);
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  editPaciente(paciente: Paciente) {
    this.editMode = true;
    this.currentPacienteId = paciente.id;
    this.isModalOpen = true;

    while (this.familiares.length) {
      this.familiares.removeAt(0);
    }

    const fechaNacimiento = new Date(paciente.fecha_nacimiento);
    const fechaFormateada = fechaNacimiento.toISOString().split('T')[0];

    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      fecha_nacimiento: fechaFormateada,
      edad: paciente.edad,
      email: (paciente as any).email || '',
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
    Object.keys(this.pacienteForm.controls).forEach(key => {
      this.pacienteForm.get(key)?.setErrors(null);
      this.pacienteForm.get(key)?.markAsUntouched();
    });
  }

  openHistoriaClinica(paciente: Paciente) {
    this.router.navigate(['/historia-clinica', paciente.id], {
      queryParams: { nombre: paciente.nombre }
    });
  }
}
