import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Order } from './Order';
import * as bcrypt from 'bcrypt';

/**
 * Define los roles de usuario en el sistema.
 * Determina los permisos y accesos a diferentes funcionalidades.
 */
export enum UserRole {
  ADMIN = 'admin',        // Administrador con acceso total al sistema.
  OWNER = 'owner',        // Propietario del negocio, similar al admin.
}

/**
 * Entidad que representa a un usuario del sistema.
 */
@Entity('users') // Especifica el nombre de la tabla en la base de datos.
export class User {
  /**
   * Identificador único del usuario, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Nombre de usuario único para el inicio de sesión.
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  /**
   * Nombre(s) del usuario.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  /**
   * Apellido(s) del usuario.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  /**
   * Dirección de correo electrónico del usuario (opcional, podría ser único si se usa para login/notificaciones).
   */
  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email: string | null;

  /**
   * Contraseña del usuario, almacenada de forma segura (hasheada).
   * No se debe seleccionar por defecto en las consultas.
   */
  @Column({ select: false })
  password: string;

  /**
   * Rol asignado al usuario, determina sus permisos.
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OWNER, // Rol por defecto para nuevos usuarios, ajustar según necesidad.
  })
  role: UserRole;

  /**
   * Indica si la cuenta de usuario está activa o deshabilitada.
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Fecha y hora del último inicio de sesión del usuario (opcional).
   */
  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  /**
   * Lista de pedidos creados por este usuario.
   * Relación One-to-Many con la entidad Order.
   */
  @OneToMany(() => Order, order => order.createdBy)
  orders: Order[];

  /**
   * Fecha y hora en que se creó el usuario, gestionada automáticamente.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha y hora de la última actualización del usuario, gestionada automáticamente.
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Hook de TypeORM que se ejecuta antes de insertar un nuevo usuario.
   * Se utiliza para hashear la contraseña si se proporciona una nueva.
   */
  @BeforeInsert()
  async hashPasswordBeforeInsert() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * Hook de TypeORM que se ejecuta antes de actualizar un usuario existente.
   * Se utiliza para hashear la contraseña si se ha modificado.
   * Es importante asegurarse de que esto solo ocurra si la contraseña realmente cambió,
   * para no re-hashear una contraseña ya hasheada si el campo password no fue parte de la actualización.
   * (La lógica actual hasheará si `this.password` tiene un valor, lo cual puede ser un problema
   * si se carga la entidad con el hash y se guarda sin cambiar la contraseña).
   * Se necesitaría una lógica más sofisticada para manejar esto correctamente si se permite
   * la actualización de la contraseña a través del guardado general de la entidad User.
   */
  @BeforeUpdate()
  async hashPasswordBeforeUpdate() {
    // Esta lógica es peligrosa si se carga un usuario con su hash y se guarda sin intención de cambiar el password.
    // Idealmente, el hash solo se actualiza si se proporciona una nueva contraseña en texto plano.
    // Por ahora, se comentará para evitar re-hasheo accidental. La actualización de contraseña debería tener su propio flujo.
    // if (this.password) {
    //   // Verificar si la contraseña es un hash (ej. longitud, formato) o si es nueva para evitar doble hasheo.
    //   // Esta es una simplificación y puede no ser segura.
    //   const isLikelyHash = this.password.length === 60 && this.password.startsWith('$2b$'); 
    //   if (!isLikelyHash) {
    //     this.password = await bcrypt.hash(this.password, 10);
    //   }
    // }
  }

  /**
   * Compara una contraseña en texto plano con la contraseña hasheada del usuario.
   * @param attempt Contraseña en texto plano a comparar.
   * @returns Promesa que resuelve a true si las contraseñas coinciden, false en caso contrario.
   */
  async comparePassword(attempt: string): Promise<boolean> {
    if (!this.password && !attempt) return true; // O false, dependiendo de la política para contraseñas vacías
    if (!this.password || !attempt) return false;
    return bcrypt.compare(attempt, this.password);
  }
} 