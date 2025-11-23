import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HistoriaClinicaService, HistoriaClinica } from '../../services/historia-clinica.service';
import { HistorialMedicoService, HistorialMedico } from '../../services/historial-medico.service';
import { PlanTratamientoService, PlanTratamiento } from '../../services/plan-tratamiento.service';
import { ProcedimientoService, Procedimiento } from '../../services/procedimiento.service';
import { AiService, AudioAnalysisResponse } from '../../services/ai.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './historia-clinica.component.html',
  styleUrls: ['./historia-clinica.component.css']
})
export class HistoriaClinicaComponent implements OnInit {
  pacienteId: string | null = null;
  pacienteName: string | null = null;
  activeTab: string = 'historia-clinica';

  historiaClinica: HistoriaClinica | null = null;
  historialMedico: HistorialMedico | null = null;
  planesTratamiento: PlanTratamiento[] = [];
  procedimientos: Procedimiento[] = [];
  historiaClinicaForm!: FormGroup;
  historialMedicoForm!: FormGroup;
  isLoading = false;
  hasHistoriaClinica = false;
  showForm = false;
  isEditingHistoriaClinica = false;
  isEditingHistorialMedico = false;

  // Plan de Tratamiento
  newPlanTratamiento: any = {
    diagnosticoTratamiento: '',
    estado: '',
    fecha: '',
    pieza: '',
    precio: 0
  };
  isAddingPlan = false;
  editingPlanId: number | null = null;

  // Procedimientos (Trabajos Realizados)
  newProcedimiento: any = {
    fecha: '',
    proximaCita: '',
    trabajoRealizado: '',
    planTratamientoId: null
  };
  isAddingProcedimiento = false;
  editingProcedimientoId: number | null = null;

  // Carga masiva desde JSON
  showJsonModal = false;
  jsonInput = '';
  isLoadingJson = false;

  // Grabación de voz y análisis IA
  showAudioModal = false;
  isRecording = false;
  isSendingAudio = false;
  isAnalyzing = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  audioAnalysisResult: AudioAnalysisResponse | null = null;
  showAnalysisPreview = false;
  isEditingAnalysis = false;

  examenBucalOptions = [
    'Higiene bucal',
    'Mucosa Bucal',
    'Otros datos',
    'Dientes',
    'Paladar',
    'Piso de boca',
    'Oclusión',
    'Lengua',
    'Encía',
    'Labios'
  ];

  enfermedadesOptions = [
    'Cardiopatía',
    'Epilepsia',
    'Fiebre reumática',
    'Marca pasos',
    'Artritis',
    'Tratamiento oncológico',
    'Deficiencia Renal',
    'Tuberculosis',
    'Hipertensión arterial',
    'Anemia',
    'Diabetes'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private formBuilder: FormBuilder,
    private historiaClinicaService: HistoriaClinicaService,
    private historialMedicoService: HistorialMedicoService,
    private planTratamientoService: PlanTratamientoService,
    private procedimientoService: ProcedimientoService,
    private aiService: AiService,
    private toastr: ToastrService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.pacienteId = this.route.snapshot.paramMap.get('id');
    this.pacienteName = this.route.snapshot.queryParamMap.get('nombre');

    if (this.pacienteId) {
      this.loadHistoriaClinica();
    }
  }

  private initForms(): void {
    const today = new Date().toISOString().split('T')[0];

    // Formulario Historia Clínica
    this.historiaClinicaForm = this.formBuilder.group({
      fechaIngreso: [today, Validators.required],
      motivoConsulta: ['', [Validators.required, Validators.minLength(10)]],
      examenBucal: [[]]
    });

    // Formulario Historial Médico
    this.historialMedicoForm = this.formBuilder.group({
      alergia: [false, Validators.required],
      fuma: [false, Validators.required],
      nombreAlergias: [''],
      nombreTratamiento: [''],
      otrasEnfermedades: [''],
      tratamientoActivo: [false, Validators.required],
      ultimaConsulta: [''],
      enfermedades: [[]]
    });

    // Watchers para campos condicionales
    this.historialMedicoForm.get('alergia')?.valueChanges.subscribe(value => {
      const nombreAlergiasControl = this.historialMedicoForm.get('nombreAlergias');
      if (value) {
        nombreAlergiasControl?.setValidators([Validators.required]);
      } else {
        nombreAlergiasControl?.clearValidators();
        nombreAlergiasControl?.setValue('');
      }
      nombreAlergiasControl?.updateValueAndValidity();
    });

    this.historialMedicoForm.get('tratamientoActivo')?.valueChanges.subscribe(value => {
      const nombreTratamientoControl = this.historialMedicoForm.get('nombreTratamiento');
      if (value) {
        nombreTratamientoControl?.setValidators([Validators.required]);
      } else {
        nombreTratamientoControl?.clearValidators();
        nombreTratamientoControl?.setValue('');
      }
      nombreTratamientoControl?.updateValueAndValidity();
    });
  }

  private loadHistoriaClinica(): void {
    this.isLoading = true;
    const pacienteIdNumber = parseInt(this.pacienteId!, 10);

    this.historiaClinicaService.getByPacienteId(pacienteIdNumber)
      .subscribe({
        next: (historia) => {
          console.log('Historia clínica encontrada:', historia);
          this.historiaClinica = historia;
          this.hasHistoriaClinica = true;
          this.showForm = false;

          // Cargar el historial médico
          if (historia.id) {
            this.loadHistorialMedico(historia.id);
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.log('No se encontró historia clínica:', error);
          if (error.status === 404) {
            this.hasHistoriaClinica = false;
            this.showForm = true;
          } else {
            this.toastr.error('Error al cargar la historia clínica');
          }
          this.isLoading = false;
        }
      });
  }

  private loadHistorialMedico(historiaClinicaId: number): void {
    this.historialMedicoService.getByHistoriaClinicaId(historiaClinicaId)
      .subscribe({
        next: (historial) => {
          console.log('Historial médico encontrado:', historial);
          this.historialMedico = historial;
          this.historialMedicoForm.patchValue(historial);

          // Ahora que tenemos el historial médico, cargar planes de tratamiento
          if (historial.id) {
            this.loadPlanesTratamiento(historial.id);
          }
        },
        error: (error) => {
          console.log('No se encontró historial médico:', error);
          // No mostramos error porque es normal que no exista aún
        }
      });
  }

  toggleExamenBucal(opcion: string): void {
    const examenBucal = this.historiaClinicaForm.get('examenBucal')?.value || [];
    const index = examenBucal.indexOf(opcion);

    if (index > -1) {
      examenBucal.splice(index, 1);
    } else {
      examenBucal.push(opcion);
    }

    this.historiaClinicaForm.patchValue({ examenBucal });
  }

  isExamenBucalSelected(opcion: string): boolean {
    const examenBucal = this.historiaClinicaForm.get('examenBucal')?.value || [];
    return examenBucal.includes(opcion);
  }

  toggleEnfermedad(opcion: string): void {
    const enfermedades = this.historialMedicoForm.get('enfermedades')?.value || [];
    const index = enfermedades.indexOf(opcion);

    if (index > -1) {
      enfermedades.splice(index, 1);
    } else {
      enfermedades.push(opcion);
    }

    this.historialMedicoForm.patchValue({ enfermedades });
  }

  isEnfermedadSelected(opcion: string): boolean {
    const enfermedades = this.historialMedicoForm.get('enfermedades')?.value || [];
    return enfermedades.includes(opcion);
  }

  nextToHistorialMedico(): void {
    if (!this.historiaClinicaForm.valid) {
      this.toastr.warning('Por favor complete los campos de Historia Clínica');
      Object.keys(this.historiaClinicaForm.controls).forEach(key => {
        const control = this.historiaClinicaForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }
    this.setActiveTab('historial-medico');
  }

  backToHistoriaClinica(): void {
    this.setActiveTab('historia-clinica');
  }

  onSubmit(): void {
    // Si estamos editando solo historia clínica
    if (this.isEditingHistoriaClinica && !this.isEditingHistorialMedico) {
      this.updateHistoriaClinica();
      return;
    }

    // Si estamos editando solo historial médico
    if (this.isEditingHistorialMedico && !this.isEditingHistoriaClinica) {
      this.updateHistorialMedico();
      return;
    }

    // Si estamos creando ambos registros nuevos
    if (!this.historiaClinicaForm.valid || !this.historialMedicoForm.valid) {
      this.toastr.warning('Por favor complete todos los campos requeridos');
      Object.keys(this.historialMedicoForm.controls).forEach(key => {
        const control = this.historialMedicoForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isLoading = true;

    const formHistoriaClinica = this.historiaClinicaForm.value;
    const formHistorialMedico = this.historialMedicoForm.value;
    const dentistaId = localStorage.getItem('id');

    if (!dentistaId) {
      this.toastr.error('No se encontró el ID del dentista');
      this.isLoading = false;
      return;
    }

    // Preparar datos de Historia Clínica
    const historiaClinicaData = {
      fechaIngreso: formHistoriaClinica.fechaIngreso,
      motivoConsulta: formHistoriaClinica.motivoConsulta,
      pacienteId: parseInt(this.pacienteId!, 10),
      dentistas: [parseInt(dentistaId, 10)],
      examenBucal: formHistoriaClinica.examenBucal.length > 0 ? formHistoriaClinica.examenBucal : []
    };

    console.log('Creando historia clínica completa...');
    console.log('Historia Clínica:', historiaClinicaData);

    // Primero crear la Historia Clínica
    this.historiaClinicaService.create(historiaClinicaData)
      .subscribe({
        next: (historiaCreada) => {
          console.log('Historia clínica creada:', historiaCreada);

          // Ahora crear el Historial Médico con el ID de la historia clínica
          const historialMedicoData = {
            historiaClinicaId: historiaCreada.id,
            alergia: formHistorialMedico.alergia,
            fuma: formHistorialMedico.fuma,
            nombreAlergias: formHistorialMedico.nombreAlergias || undefined,
            nombreTratamiento: formHistorialMedico.nombreTratamiento || undefined,
            otrasEnfermedades: formHistorialMedico.otrasEnfermedades || undefined,
            tratamientoActivo: formHistorialMedico.tratamientoActivo,
            ultimaConsulta: formHistorialMedico.ultimaConsulta ? new Date(formHistorialMedico.ultimaConsulta) : undefined,
            enfermedades: formHistorialMedico.enfermedades.length > 0 ? formHistorialMedico.enfermedades : undefined
          };

          console.log('Creando historial médico:', historialMedicoData);

          this.historialMedicoService.create(historialMedicoData)
            .subscribe({
              next: (historialCreado) => {
                console.log('Historial médico creado:', historialCreado);
                this.toastr.success('Historia clínica e historial médico creados exitosamente');
                this.historiaClinica = historiaCreada;
                this.historialMedico = historialCreado;
                this.hasHistoriaClinica = true;
                this.showForm = false;
                this.setActiveTab('historia-clinica');
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Error al crear historial médico:', error);
                this.toastr.warning('Historia clínica creada, pero hubo un error al crear el historial médico');
                this.historiaClinica = historiaCreada;
                this.hasHistoriaClinica = true;
                this.isLoading = false;
              }
            });
        },
        error: (error) => {
          console.error('Error al crear historia clínica:', error);
          this.toastr.error('Error al crear la historia clínica');
          this.isLoading = false;
        }
      });
  }

  editHistoriaClinica(): void {
    if (this.historiaClinica) {
      this.isEditingHistoriaClinica = true;
      this.showForm = true;
      this.historiaClinicaForm.patchValue({
        fechaIngreso: this.historiaClinica.fechaIngreso,
        motivoConsulta: this.historiaClinica.motivoConsulta,
        examenBucal: this.historiaClinica.examenBucal || []
      });
    }
  }

  editHistorialMedico(): void {
    if (this.historialMedico) {
      this.isEditingHistorialMedico = true;
      this.showForm = true;
      this.setActiveTab('historial-medico');
      this.historialMedicoForm.patchValue({
        alergia: this.historialMedico.alergia,
        fuma: this.historialMedico.fuma,
        nombreAlergias: this.historialMedico.nombreAlergias || '',
        nombreTratamiento: this.historialMedico.nombreTratamiento || '',
        otrasEnfermedades: this.historialMedico.otrasEnfermedades || '',
        tratamientoActivo: this.historialMedico.tratamientoActivo,
        ultimaConsulta: this.historialMedico.ultimaConsulta || '',
        enfermedades: this.historialMedico.enfermedades || []
      });
    }
  }

  updateHistoriaClinica(): void {
    if (!this.historiaClinicaForm.valid || !this.historiaClinica) {
      this.toastr.warning('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    const formValue = this.historiaClinicaForm.value;
    const dentistaId = localStorage.getItem('id');

    const updateData = {
      fechaIngreso: formValue.fechaIngreso,
      motivoConsulta: formValue.motivoConsulta,
      dentistas: [parseInt(dentistaId!, 10)],
      examenBucal: formValue.examenBucal.length > 0 ? formValue.examenBucal : []
    };

    this.historiaClinicaService.update(this.historiaClinica.id, updateData)
      .subscribe({
        next: (updated) => {
          console.log('Historia clínica actualizada:', updated);
          this.historiaClinica = updated;
          this.isEditingHistoriaClinica = false;
          this.showForm = false;
          this.toastr.success('Historia clínica actualizada exitosamente');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al actualizar historia clínica:', error);
          this.toastr.error('Error al actualizar la historia clínica');
          this.isLoading = false;
        }
      });
  }

  updateHistorialMedico(): void {
    if (!this.historialMedicoForm.valid || !this.historialMedico) {
      this.toastr.warning('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    const formValue = this.historialMedicoForm.value;

    const updateData = {
      alergia: formValue.alergia,
      fuma: formValue.fuma,
      nombreAlergias: formValue.nombreAlergias || undefined,
      nombreTratamiento: formValue.nombreTratamiento || undefined,
      otrasEnfermedades: formValue.otrasEnfermedades || undefined,
      tratamientoActivo: formValue.tratamientoActivo,
      ultimaConsulta: formValue.ultimaConsulta ? new Date(formValue.ultimaConsulta) : undefined,
      enfermedades: formValue.enfermedades.length > 0 ? formValue.enfermedades : undefined
    };

    this.historialMedicoService.update(this.historialMedico.id, updateData)
      .subscribe({
        next: (updated) => {
          console.log('Historial médico actualizado:', updated);
          this.historialMedico = updated;
          this.isEditingHistorialMedico = false;
          this.showForm = false;
          this.toastr.success('Historial médico actualizado exitosamente');
          this.isLoading = false;
          this.setActiveTab('historial-medico');
        },
        error: (error) => {
          console.error('Error al actualizar historial médico:', error);
          this.toastr.error('Error al actualizar el historial médico');
          this.isLoading = false;
        }
      });
  }

  cancelEdit(): void {
    this.isEditingHistoriaClinica = false;
    this.isEditingHistorialMedico = false;
    this.showForm = false;
    this.historiaClinicaForm.reset();
    this.historialMedicoForm.reset();
    this.initForms();
  }

  cancelForm(): void {
    this.historiaClinicaForm.reset();
    this.historialMedicoForm.reset();
    this.initForms();
    this.setActiveTab('historia-clinica');
  }

  goBack(): void {
    this.location.back();
  }

  navigateToPacientes(): void {
    this.router.navigate(['/pacientes']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Métodos para Plan de Tratamiento
  private loadPlanesTratamiento(historialMedicoId: number): void {
    // Usar el endpoint correcto que busca por historialMedicoId
    this.planTratamientoService.getByHistorialMedicoId(historialMedicoId)
      .subscribe({
        next: (planes) => {
          console.log('Planes de tratamiento encontrados:', planes);
          // Ordenar por fecha (más reciente primero)
          this.planesTratamiento = planes.sort((a, b) => {
            const fechaA = new Date(a.fecha || a.createdAt);
            const fechaB = new Date(b.fecha || b.createdAt);
            return fechaB.getTime() - fechaA.getTime();
          });
          this.calcularTotal();

          // Después de cargar los planes, cargar los procedimientos
          this.loadProcedimientos();
        },
        error: (error) => {
          console.log('No se encontraron planes de tratamiento:', error);
          this.planesTratamiento = [];
        }
      });
  }

  startAddingPlan(): void {
    this.isAddingPlan = true;
    this.newPlanTratamiento = {
      diagnosticoTratamiento: '',
      estado: 'Pendiente',
      fecha: new Date().toISOString().split('T')[0],
      pieza: '',
      precio: 0
    };
  }

  cancelAddingPlan(): void {
    this.isAddingPlan = false;
    this.newPlanTratamiento = {
      diagnosticoTratamiento: '',
      estado: '',
      fecha: '',
      pieza: '',
      precio: 0
    };
  }

  savePlanTratamiento(): void {
    if (!this.historiaClinica?.id) {
      this.toastr.error('No se encontró la historia clínica');
      return;
    }

    if (!this.newPlanTratamiento.diagnosticoTratamiento || !this.newPlanTratamiento.estado ||
        !this.newPlanTratamiento.fecha || !this.newPlanTratamiento.pieza ||
        this.newPlanTratamiento.precio <= 0) {
      this.toastr.warning('Por favor complete todos los campos');
      return;
    }

    const planData = {
      diagnosticoTratamiento: this.newPlanTratamiento.diagnosticoTratamiento,
      estado: this.newPlanTratamiento.estado,
      fecha: this.newPlanTratamiento.fecha,
      pieza: this.newPlanTratamiento.pieza,
      precio: parseFloat(this.newPlanTratamiento.precio),
      historiaClinicaId: this.historiaClinica.id
    };

    this.planTratamientoService.create(planData)
      .subscribe({
        next: (plan) => {
          console.log('Plan de tratamiento creado:', plan);
          this.planesTratamiento.unshift(plan); // Agregar al inicio (más reciente)
          this.calcularTotal();
          this.toastr.success('Plan de tratamiento agregado exitosamente');
          this.cancelAddingPlan();
        },
        error: (error) => {
          console.error('Error al crear plan de tratamiento:', error);
          this.toastr.error('Error al agregar el plan de tratamiento');
        }
      });
  }

  editPlan(plan: PlanTratamiento): void {
    this.editingPlanId = plan.id;
  }

  cancelEditPlan(): void {
    this.editingPlanId = null;
    if (this.historialMedico?.id) {
      this.loadPlanesTratamiento(this.historialMedico.id);
    }
  }

  updatePlan(plan: PlanTratamiento): void {
    const updateData = {
      diagnosticoTratamiento: plan.diagnosticoTratamiento,
      estado: plan.estado,
      fecha: plan.fecha,
      pieza: plan.pieza,
      precio: plan.precio
    };

    this.planTratamientoService.update(plan.id, updateData)
      .subscribe({
        next: (updated) => {
          console.log('Plan de tratamiento actualizado:', updated);
          const index = this.planesTratamiento.findIndex(p => p.id === plan.id);
          if (index !== -1) {
            this.planesTratamiento[index] = updated;
          }
          this.toastr.success('Plan de tratamiento actualizado exitosamente');
          this.editingPlanId = null;
        },
        error: (error) => {
          console.error('Error al actualizar plan de tratamiento:', error);
          this.toastr.error('Error al actualizar el plan de tratamiento');
        }
      });
  }

  deletePlan(planId: number): void {
    if (confirm('¿Está seguro de eliminar este plan de tratamiento?')) {
      this.planTratamientoService.delete(planId)
        .subscribe({
          next: () => {
            console.log('Plan de tratamiento eliminado');
            this.planesTratamiento = this.planesTratamiento.filter(p => p.id !== planId);
            this.toastr.success('Plan de tratamiento eliminado exitosamente');
          },
          error: (error) => {
            console.error('Error al eliminar plan de tratamiento:', error);
            this.toastr.error('Error al eliminar el plan de tratamiento');
          }
        });
    }
  }

  calcularTotal(): number {
    return this.planesTratamiento.reduce((total, plan) => total + plan.precio, 0);
  }

  // Métodos para Procedimientos (Trabajos Realizados)
  private loadProcedimientos(): void {
    if (this.planesTratamiento.length === 0) {
      this.procedimientos = [];
      return;
    }

    // Cargar procedimientos de todos los planes de tratamiento
    const procedimientosObservables = this.planesTratamiento.map(plan =>
      this.procedimientoService.getByPlanTratamientoId(plan.id)
    );

    forkJoin<Procedimiento[][]>(procedimientosObservables).subscribe({
      next: (resultados: Procedimiento[][]) => {
        // Aplanar el array de arrays
        const procedimientosFlat = resultados.flat();
        // Ordenar por fecha (más reciente primero)
        this.procedimientos = procedimientosFlat.sort((a, b) => {
          const fechaA = new Date(a.fecha || a.createdAt);
          const fechaB = new Date(b.fecha || b.createdAt);
          return fechaB.getTime() - fechaA.getTime();
        });
        console.log('Procedimientos encontrados:', this.procedimientos);
      },
      error: (error) => {
        console.log('No se encontraron procedimientos:', error);
        this.procedimientos = [];
      }
    });
  }

  startAddingProcedimiento(): void {
    if (this.planesTratamiento.length === 0) {
      this.toastr.warning('Debe tener al menos un plan de tratamiento para agregar procedimientos');
      return;
    }
    this.isAddingProcedimiento = true;
    this.newProcedimiento = {
      fecha: new Date().toISOString().split('T')[0],
      proximaCita: '',
      trabajoRealizado: '',
      planTratamientoId: this.planesTratamiento[0].id
    };
  }

  cancelAddingProcedimiento(): void {
    this.isAddingProcedimiento = false;
    this.newProcedimiento = {
      fecha: '',
      proximaCita: '',
      trabajoRealizado: '',
      planTratamientoId: null
    };
  }

  saveProcedimiento(): void {
    if (!this.newProcedimiento.fecha || !this.newProcedimiento.trabajoRealizado || !this.newProcedimiento.planTratamientoId) {
      this.toastr.warning('Por favor complete los campos obligatorios (Fecha, Trabajo Realizado y Plan de Tratamiento)');
      return;
    }

    const procedimientoData: any = {
      fecha: this.newProcedimiento.fecha,
      trabajoRealizado: this.newProcedimiento.trabajoRealizado,
      planTratamientoId: parseInt(this.newProcedimiento.planTratamientoId, 10)
    };

    if (this.newProcedimiento.proximaCita) {
      procedimientoData.proximaCita = this.newProcedimiento.proximaCita;
    }

    this.procedimientoService.create(procedimientoData)
      .subscribe({
        next: (procedimiento) => {
          console.log('Procedimiento creado:', procedimiento);
          this.procedimientos.unshift(procedimiento); // Agregar al inicio (más reciente)
          this.toastr.success('Trabajo realizado agregado exitosamente');
          this.cancelAddingProcedimiento();
        },
        error: (error) => {
          console.error('Error al crear procedimiento:', error);
          this.toastr.error('Error al agregar el trabajo realizado');
        }
      });
  }

  editProcedimiento(procedimiento: Procedimiento): void {
    this.editingProcedimientoId = procedimiento.id;
  }

  cancelEditProcedimiento(): void {
    this.editingProcedimientoId = null;
    this.loadProcedimientos();
  }

  updateProcedimiento(procedimiento: Procedimiento): void {
    const updateData: any = {
      fecha: procedimiento.fecha,
      trabajoRealizado: procedimiento.trabajoRealizado,
      planTratamientoId: procedimiento.planTratamiento?.id
    };

    if (procedimiento.proximaCita) {
      updateData.proximaCita = procedimiento.proximaCita;
    }

    this.procedimientoService.update(procedimiento.id, updateData)
      .subscribe({
        next: (updated) => {
          console.log('Procedimiento actualizado:', updated);
          const index = this.procedimientos.findIndex(p => p.id === procedimiento.id);
          if (index !== -1) {
            this.procedimientos[index] = updated;
          }
          this.toastr.success('Trabajo realizado actualizado exitosamente');
          this.editingProcedimientoId = null;
        },
        error: (error) => {
          console.error('Error al actualizar procedimiento:', error);
          this.toastr.error('Error al actualizar el trabajo realizado');
        }
      });
  }

  deleteProcedimiento(procedimientoId: number): void {
    if (confirm('¿Está seguro de eliminar este trabajo realizado?')) {
      this.procedimientoService.delete(procedimientoId)
        .subscribe({
          next: () => {
            console.log('Procedimiento eliminado');
            this.procedimientos = this.procedimientos.filter(p => p.id !== procedimientoId);
            this.toastr.success('Trabajo realizado eliminado exitosamente');
          },
          error: (error) => {
            console.error('Error al eliminar procedimiento:', error);
            this.toastr.error('Error al eliminar el trabajo realizado');
          }
        });
    }
  }

  getPlanTratamientoNombre(planTratamiento: any): string {
    return planTratamiento?.diagnosticoTratamiento || 'N/A';
  }

  // Métodos para carga masiva desde JSON
  openJsonModal(): void {
    if (!this.historiaClinica) {
      this.toastr.error('Debe crear primero la Historia Clínica');
      return;
    }
    this.showJsonModal = true;
    this.jsonInput = '';
  }

  closeJsonModal(): void {
    this.showJsonModal = false;
    this.jsonInput = '';
  }

  getJsonExample1(): string {
    return JSON.stringify({
      "planesTratamiento": [
        {
          "diagnosticoTratamiento": "Caries en molar superior",
          "estado": "Pendiente",
          "pieza": "Pieza 16",
          "precio": 150.00
        },
        {
          "diagnosticoTratamiento": "Limpieza dental profunda",
          "estado": "En Proceso",
          "pieza": "Todas",
          "precio": 80.00
        },
        {
          "diagnosticoTratamiento": "Endodoncia",
          "estado": "Pendiente",
          "pieza": "Pieza 26",
          "precio": 350.00
        }
      ],
      "procedimientos": [
        {
          "trabajoRealizado": "Evaluación inicial y toma de radiografías",
          "proximaCita": "2025-12-01",
          "planIndex": 0
        },
        {
          "trabajoRealizado": "Primera fase de limpieza dental",
          "proximaCita": "2025-11-30",
          "planIndex": 1
        }
      ]
    }, null, 2);
  }

  getJsonExample2(): string {
    return JSON.stringify({
      "planesTratamiento": [
        {
          "diagnosticoTratamiento": "Extracción de muela del juicio",
          "estado": "Completado",
          "pieza": "Pieza 38",
          "precio": 200.00
        },
        {
          "diagnosticoTratamiento": "Colocación de corona dental",
          "estado": "En Proceso",
          "pieza": "Pieza 11",
          "precio": 450.00
        },
        {
          "diagnosticoTratamiento": "Blanqueamiento dental",
          "estado": "Pendiente",
          "pieza": "Todas",
          "precio": 180.00
        },
        {
          "diagnosticoTratamiento": "Ortodoncia brackets",
          "estado": "Pendiente",
          "pieza": "Arcada completa",
          "precio": 2500.00
        }
      ],
      "procedimientos": [
        {
          "trabajoRealizado": "Extracción exitosa de muela del juicio, sutura realizada",
          "proximaCita": "2025-12-05",
          "planIndex": 0
        },
        {
          "trabajoRealizado": "Preparación del diente para corona, toma de impresión",
          "proximaCita": "2025-12-10",
          "planIndex": 1
        },
        {
          "trabajoRealizado": "Prueba de color para corona dental",
          "planIndex": 1
        }
      ]
    }, null, 2);
  }

  copyExample(example: number): void {
    this.jsonInput = example === 1 ? this.getJsonExample1() : this.getJsonExample2();
    this.toastr.success('Ejemplo copiado al editor');
  }

  processJsonData(): void {
    if (!this.jsonInput.trim()) {
      this.toastr.warning('Por favor ingrese un JSON válido');
      return;
    }

    if (!this.historialMedico?.id || !this.historiaClinica?.id) {
      this.toastr.error('No se encontró el Historial Médico. Debe crear primero el historial médico.');
      return;
    }

    try {
      const data = JSON.parse(this.jsonInput);

      if (!data.planesTratamiento || !Array.isArray(data.planesTratamiento)) {
        this.toastr.error('El JSON debe contener un array "planesTratamiento"');
        return;
      }

      // Los procedimientos son opcionales
      if (data.procedimientos && !Array.isArray(data.procedimientos)) {
        this.toastr.error('Si se incluye "procedimientos", debe ser un array');
        return;
      }

      // Si no hay procedimientos, crear un array vacío
      if (!data.procedimientos) {
        data.procedimientos = [];
      }

      this.isLoadingJson = true;
      const today = new Date().toISOString().split('T')[0];

      // Crear los planes de tratamiento primero
      const planesObservables = data.planesTratamiento.map((plan: any, index: number) => {
        // Validar campos requeridos
        if (!plan.diagnosticoTratamiento || !plan.pieza || plan.precio === undefined || plan.precio === null) {
          throw new Error(`Plan ${index + 1}: Faltan campos requeridos (diagnosticoTratamiento, pieza, precio)`);
        }

        const precio = typeof plan.precio === 'string' ? parseFloat(plan.precio) : plan.precio;

        const planData = {
          diagnosticoTratamiento: plan.diagnosticoTratamiento,
          estado: plan.estado || 'Pendiente',
          fecha: plan.fecha || today,
          pieza: plan.pieza,
          precio: isNaN(precio) ? 0 : precio,
          historiaClinicaId: this.historiaClinica!.id
        };
        return this.planTratamientoService.create(planData);
      });

      // Primero crear todos los planes
      forkJoin<PlanTratamiento[]>(planesObservables).subscribe({
        next: (planesCreados: PlanTratamiento[]) => {
          console.log('Planes de tratamiento creados:', planesCreados);
          this.planesTratamiento = [...planesCreados, ...this.planesTratamiento].sort((a, b) => {
            const fechaA = new Date(a.fecha || a.createdAt);
            const fechaB = new Date(b.fecha || b.createdAt);
            return fechaB.getTime() - fechaA.getTime();
          });

          // Ahora crear los procedimientos usando los IDs de los planes creados
          const procedimientosObservables = data.procedimientos.map((proc: any, index: number) => {
            // Validar campos requeridos
            if (!proc.trabajoRealizado) {
              throw new Error(`Procedimiento ${index + 1}: Falta el campo "trabajoRealizado"`);
            }

            const planIndex = proc.planIndex;
            if (planIndex === undefined || planIndex < 0 || planIndex >= planesCreados.length) {
              throw new Error(`Procedimiento ${index + 1}: planIndex inválido (${planIndex}). Debe ser un número entre 0 y ${planesCreados.length - 1}`);
            }

            const procedimientoData: any = {
              fecha: proc.fecha || today,
              trabajoRealizado: proc.trabajoRealizado,
              planTratamientoId: planesCreados[planIndex].id
            };

            if (proc.proximaCita) {
              procedimientoData.proximaCita = proc.proximaCita;
            }

            return this.procedimientoService.create(procedimientoData);
          });

          if (procedimientosObservables.length > 0) {
            forkJoin<Procedimiento[]>(procedimientosObservables).subscribe({
              next: (procedimientosCreados: Procedimiento[]) => {
                console.log('Procedimientos creados:', procedimientosCreados);
                this.procedimientos = [...procedimientosCreados, ...this.procedimientos].sort((a, b) => {
                  const fechaA = new Date(a.fecha || a.createdAt);
                  const fechaB = new Date(b.fecha || b.createdAt);
                  return fechaB.getTime() - fechaA.getTime();
                });
                this.toastr.success(`${planesCreados.length} planes y ${procedimientosCreados.length} procedimientos creados exitosamente`);
                this.isLoadingJson = false;
                this.closeJsonModal();
              },
              error: (error) => {
                console.error('Error al crear procedimientos:', error);
                this.toastr.error('Error al crear algunos procedimientos. Los planes de tratamiento fueron creados.');
                this.isLoadingJson = false;
              }
            });
          } else {
            this.toastr.success(`${planesCreados.length} planes de tratamiento creados exitosamente`);
            this.isLoadingJson = false;
            this.closeJsonModal();
          }
        },
        error: (error) => {
          console.error('Error al crear planes de tratamiento:', error);
          this.toastr.error('Error al procesar los planes de tratamiento: ' + (error.message || 'Error desconocido'));
          this.isLoadingJson = false;
        }
      });

    } catch (error: any) {
      console.error('Error al parsear JSON:', error);
      this.toastr.error('JSON inválido: ' + (error.message || 'Por favor verifique el formato.'));
      this.isLoadingJson = false;
    }
  }

  // Métodos para grabación de voz y análisis IA
  openAudioModal(): void {
    this.showAudioModal = true;
    this.audioAnalysisResult = null;
    this.showAnalysisPreview = false;
  }

  closeAudioModal(): void {
    this.showAudioModal = false;
    this.stopRecording();
    this.audioAnalysisResult = null;
    this.showAnalysisPreview = false;
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.toastr.info('Grabación iniciada... Habla ahora');
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      this.toastr.error('Error al acceder al micrófono');
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
    }
  }

  private processRecording(): void {
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp3' });
    const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });

    this.isSendingAudio = true;
    this.toastr.info('Enviando audio para análisis...');

    this.analyzeAudio(audioFile);
  }

  private analyzeAudio(audioFile: File): void {
    this.isSendingAudio = false;
    this.isAnalyzing = true;

    this.aiService.analyzeAudio(audioFile).subscribe({
      next: (result) => {
        console.log('Análisis de audio completado:', result);

        // Asegurar que todos los planes tengan fecha de hoy si no la tienen
        const today = new Date().toISOString().split('T')[0];
        result.planesTratamiento.forEach(plan => {
          if (!plan.fecha) {
            plan.fecha = today;
          }
        });

        // Asegurar que todos los procedimientos tengan fecha de hoy si no la tienen
        result.procedimientos.forEach(proc => {
          if (!proc.fecha) {
            proc.fecha = today;
          }
        });

        this.audioAnalysisResult = result;
        this.showAnalysisPreview = true;
        this.isAnalyzing = false;
        this.toastr.success('Análisis completado');
      },
      error: (error) => {
        console.error('Error al analizar audio:', error);
        this.toastr.error('Error al analizar el audio');
        this.isSendingAudio = false;
        this.isAnalyzing = false;
      }
    });
  }

  applyAudioAnalysis(): void {
    if (!this.audioAnalysisResult) return;

    // Usar el mismo método que el JSON para procesar los datos
    const data = {
      planesTratamiento: this.audioAnalysisResult.planesTratamiento,
      procedimientos: this.audioAnalysisResult.procedimientos || []
    };

    this.processAnalysisData(data);
  }

  private processAnalysisData(data: any): void {
    if (!this.historialMedico?.id || !this.historiaClinica?.id) {
      this.toastr.error('No se encontró el Historial Médico. Debe crear primero el historial médico.');
      return;
    }

    this.isAnalyzing = true;
    const today = new Date().toISOString().split('T')[0];

    // Crear los planes de tratamiento primero
    const planesObservables = data.planesTratamiento.map((plan: any, index: number) => {
      // Validar campos requeridos
      if (!plan.diagnosticoTratamiento || !plan.pieza || plan.precio === undefined || plan.precio === null) {
        throw new Error(`Plan ${index + 1}: Faltan campos requeridos (diagnosticoTratamiento, pieza, precio)`);
      }

      const precio = typeof plan.precio === 'string' ? parseFloat(plan.precio) : plan.precio;

      const planData = {
        diagnosticoTratamiento: plan.diagnosticoTratamiento,
        estado: plan.estado || 'Pendiente',
        fecha: plan.fecha || today,
        pieza: plan.pieza,
        precio: isNaN(precio) ? 0 : precio,
        historiaClinicaId: this.historiaClinica!.id
      };
      return this.planTratamientoService.create(planData);
    });

    // Primero crear todos los planes
    forkJoin<PlanTratamiento[]>(planesObservables).subscribe({
      next: (planesCreados: PlanTratamiento[]) => {
        console.log('Planes de tratamiento creados desde análisis IA:', planesCreados);
        this.planesTratamiento = [...planesCreados, ...this.planesTratamiento].sort((a, b) => {
          const fechaA = new Date(a.fecha || a.createdAt);
          const fechaB = new Date(b.fecha || b.createdAt);
          return fechaB.getTime() - fechaA.getTime();
        });

        // Ahora crear los procedimientos usando los IDs de los planes creados
        const procedimientosObservables = data.procedimientos.map((proc: any, index: number) => {
          // Validar campos requeridos
          if (!proc.trabajoRealizado) {
            throw new Error(`Procedimiento ${index + 1}: Falta el campo "trabajoRealizado"`);
          }

          const planIndex = proc.planIndex;
          if (planIndex === undefined || planIndex < 0 || planIndex >= planesCreados.length) {
            throw new Error(`Procedimiento ${index + 1}: planIndex inválido (${planIndex}). Debe ser un número entre 0 y ${planesCreados.length - 1}`);
          }

          const procedimientoData: any = {
            fecha: proc.fecha || today,
            trabajoRealizado: proc.trabajoRealizado,
            planTratamientoId: planesCreados[planIndex].id
          };

          if (proc.proximaCita) {
            procedimientoData.proximaCita = proc.proximaCita;
          }

          return this.procedimientoService.create(procedimientoData);
        });

        if (procedimientosObservables.length > 0) {
          forkJoin<Procedimiento[]>(procedimientosObservables).subscribe({
            next: (procedimientosCreados: Procedimiento[]) => {
              console.log('Procedimientos creados desde análisis IA:', procedimientosCreados);
              this.procedimientos = [...procedimientosCreados, ...this.procedimientos].sort((a, b) => {
                const fechaA = new Date(a.fecha || a.createdAt);
                const fechaB = new Date(b.fecha || b.createdAt);
                return fechaB.getTime() - fechaA.getTime();
              });
              this.toastr.success(`${planesCreados.length} planes y ${procedimientosCreados.length} procedimientos creados desde análisis de voz`);
              this.isAnalyzing = false;
              this.closeAudioModal();
            },
            error: (error) => {
              console.error('Error al crear procedimientos desde IA:', error);
              this.toastr.error('Error al crear algunos procedimientos. Los planes de tratamiento fueron creados.');
              this.isAnalyzing = false;
            }
          });
        } else {
          this.toastr.success(`${planesCreados.length} planes de tratamiento creados desde análisis de voz`);
          this.isAnalyzing = false;
          this.closeAudioModal();
        }
      },
      error: (error) => {
        console.error('Error al crear planes de tratamiento desde IA:', error);
        this.toastr.error('Error al procesar los planes de tratamiento: ' + (error.message || 'Error desconocido'));
        this.isAnalyzing = false;
      }
    });
  }

  // Métodos para edición de análisis
  enableAnalysisEditing(): void {
    this.isEditingAnalysis = true;
  }

  cancelAnalysisEditing(): void {
    this.isEditingAnalysis = false;
  }

  saveAnalysisChanges(): void {
    this.isEditingAnalysis = false;
    this.toastr.success('Cambios guardados. Presiona "Guardar en Plan de Tratamiento" para aplicar.');
  }

  addNewPlan(): void {
    if (this.audioAnalysisResult) {
      this.audioAnalysisResult.planesTratamiento.push({
        diagnosticoTratamiento: '',
        estado: 'Pendiente',
        pieza: '',
        precio: 0,
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  }

  removePlan(index: number): void {
    if (this.audioAnalysisResult) {
      this.audioAnalysisResult.planesTratamiento.splice(index, 1);
      // Ajustar planIndex de procedimientos
      this.audioAnalysisResult.procedimientos.forEach(proc => {
        if (proc.planIndex > index) {
          proc.planIndex--;
        }
      });
      // Remover procedimientos huérfanos
      this.audioAnalysisResult.procedimientos = this.audioAnalysisResult.procedimientos.filter(
        proc => proc.planIndex < this.audioAnalysisResult!.planesTratamiento.length
      );
    }
  }

  addNewProcedimiento(): void {
    if (this.audioAnalysisResult && this.audioAnalysisResult.planesTratamiento.length > 0) {
      this.audioAnalysisResult.procedimientos.push({
        trabajoRealizado: '',
        planIndex: 0,
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  }

  removeProcedimiento(index: number): void {
    if (this.audioAnalysisResult) {
      this.audioAnalysisResult.procedimientos.splice(index, 1);
    }
  }
}
