import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService, User, CreateUserDto, UpdateUserDto } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

enum Roles {
  ADMIN = 'Administrador',
  DENTIST = 'Dentista',
  ADMINISTRATIVE = 'Administrativo'
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  users: User[] = [];
  isAdmin = false;
  loading = false;
  error = '';
  
  showForm = false;
  isEditing = false;
  currentUserId: number | null = null;
  userType: 'dentist' | 'administrative' = 'dentist';
  
  newUser: CreateUserDto = {
    nombre: '',
    correo: '',
    password: '',
    telefono: '',
    direccion: '',
    especialidad: '',
    area: '',
    cargo: ''
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (userData && userData.rol === Roles.ADMIN) {
      this.isAdmin = true;
      this.loadUsers();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios: ' + err.message;
        this.loading = false;
      }
    });
  }

  openCreateForm(type: 'dentist' | 'administrative'): void {
    this.showForm = true;
    this.isEditing = false;
    this.userType = type;
    this.resetForm();
  }

  openEditForm(user: User): void {
    this.showForm = true;
    this.isEditing = true;
    this.currentUserId = user.id;
    
    this.userType = user.rol.nombre === Roles.DENTIST ? 'dentist' : 'administrative';
    
    this.newUser = {
      nombre: user.nombre,
      correo: user.correo,
      password: '', 
      telefono: user.telefono,
      direccion: user.direccion,
    };
    
    this.userService.getUserById(user.id).subscribe({
      next: (userDetails: User) => {
        if (this.userType === 'dentist') {
          this.newUser.especialidad = userDetails.especialidad;
        } else {
          this.newUser.area = userDetails.area;
          this.newUser.cargo = userDetails.cargo;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar detalles del usuario: ' + err.message;
      }
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm() {
    this.newUser = {
      nombre: '',
      correo: '',
      password: '',
      telefono: '',
      direccion: '',
      especialidad: '',
      area: '',
      cargo: ''
    };
    this.currentUserId = null;
  }

  saveUser(): void {
    this.loading = true;
    
    if (this.isEditing && this.currentUserId) {
      const updateData: UpdateUserDto = { ...this.newUser };
      
      if (!updateData.password) {
        delete updateData.password;
      }
      
      if (this.userType === 'dentist') {
        this.userService.updateDentist(this.currentUserId, updateData).subscribe({
          next: () => {
            this.handleSuccess('Usuario actualizado correctamente');
          },
          error: (err) => {
            this.handleError('Error al actualizar dentista: ' + err.message);
          }
        });
      } else {
        this.userService.updateAdministrative(this.currentUserId, updateData).subscribe({
          next: () => {
            this.handleSuccess('Usuario actualizado correctamente');
          },
          error: (err) => {
            this.handleError('Error al actualizar administrativo: ' + err.message);
          }
        });
      }
    } else {
      if (this.userType === 'dentist') {
        this.userService.createDentist(this.newUser).subscribe({
          next: () => {
            this.handleSuccess('Dentista creado correctamente');
          },
          error: (err) => {
            this.handleError('Error al crear dentista: ' + err.message);
          }
        });
      } else {
        this.userService.createAdministrative(this.newUser).subscribe({
          next: () => {
            this.handleSuccess('Administrativo creado correctamente');
          },
          error: (err) => {
            this.handleError('Error al crear administrativo: ' + err.message);
          }
        });
      }
    }
  }

  deleteUser(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.loading = true;
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.handleSuccess('Usuario eliminado correctamente');
        },
        error: (err) => {
          this.handleError('Error al eliminar usuario: ' + err.message);
        }
      });
    }
  }

  private handleSuccess(message: string): void {
    this.loading = false;
    this.error = '';
    alert(message);
    this.closeForm();
    this.loadUsers();
  }

  private handleError(errorMessage: string): void {
    this.loading = false;
    this.error = errorMessage;
  }
}
