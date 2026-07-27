# Criterios de Evaluación del Proyecto Angular

| # | Componente | Consideraciones |
|---|------------|-----------------|
| **1** | **API REST** | La API REST seleccionada debe ser jerárquica y contar con los métodos **GET** (URI amigable, *path* y *query params*), **POST**, **PUT**, **PATCH** y **DELETE**; además debe incluir **paginación** y **ordenamiento**. |
| **2** | **Organización del Proyecto** | Utilizar una arquitectura estándar para los componentes de Angular. Organizar carpetas como **public** (imágenes, videos, etc.) y opcionalmente por características (**features**), incluyendo componentes padre e hijo y componentes contenedores (*container-presenter*). |
| | **Plantilla** | Crear o reutilizar la plantilla utilizada en el curso (u otra) y personalizarla para organizar el control de acceso (**login**), pantallas de listado y búsqueda con paginación y ordenamiento, además de pantallas de registro. Debe incluir **header**, **footer**, **navbar**, **sidebar**, **notfound**, etc. |
| **3** | **Modelos** | Crear clases y/o interfaces, **enums** y/o **types** según el caso seleccionado. |
| **4** | **Servicios** | Implementar el servicio de integración con la API REST. La URL base debe configurarse en una constante global para facilitar su modificación. |
| **5** | **Componente de Listado** | Implementar el componente de listado que incluya listados y búsquedas con los parámetros permitidos por la API. También debe permitir la eliminación previa confirmación e implementar paginación en memoria o desde el **backend**, según lo permitan las APIs utilizadas. |
| **6** | **Componente de Registro** | Implementar el componente de registro de acuerdo con el **JSON body** permitido por la API. También debe incluir la actualización de registros y validar registros duplicados. |
| **7** | **Validaciones y Mensajes** | Implementar validaciones utilizando **Reactive Forms Validators**, personalizar los mensajes en cada campo con su respectivo estilo y crear validadores personalizados. Implementar mensajes personalizados utilizando **ngx-toastr**, **ngx-sweetalert2** u otra librería de preferencia. |
| **8** | **Presentación** | Personalizar la aplicación utilizando alguna librería o framework CSS como **Tailwind CSS**, **Bootstrap**, **ngx-bootstrap**, **PrimeNG**, **Angular Material**, entre otros. |
| **9** | **Componentes Reutilizables** | Crear componentes reutilizables que reciban objetos complejos, rendericen su contenido y devuelvan resultados al componente padre mediante **@Input**, **@Output** o **model**. |
| **10** | **Otros** | Implementar funcionalidades adicionales o utilizar componentes de Angular que agreguen valor al proyecto y demuestren el aprendizaje adquirido. |

---

## Checklist

- [ ] API REST completa (GET, POST, PUT, PATCH, DELETE)
- [ ] Paginación y ordenamiento
- [ ] Arquitectura organizada (features o estándar)
- [ ] Plantilla personalizada
- [ ] Login
- [ ] Header
- [ ] Footer
- [ ] Navbar
- [ ] Sidebar
- [ ] Página Not Found
- [ ] Modelos (interfaces, clases, enums o types)
- [ ] Servicios para la API
- [ ] URL base configurable
- [ ] Componente de listado
- [ ] Búsqueda
- [ ] Eliminación con confirmación
- [ ] Componente de registro
- [ ] Actualización de registros
- [ ] Validación de duplicados
- [ ] Validaciones con Reactive Forms
- [ ] Validadores personalizados
- [ ] Mensajes personalizados (Toastr/SweetAlert)
- [ ] Framework CSS (Bootstrap, Tailwind, Material, PrimeNG, etc.)
- [ ] Componentes reutilizables
- [ ] Uso de @Input/@Output/model
- [ ] Funcionalidades adicionales