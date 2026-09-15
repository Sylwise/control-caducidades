# Validación humana del piloto de Tareas

Pendiente de ejecutar: las pruebas automáticas no sustituyen esta validación.

## Preparación

- Usar dos perfiles de navegador independientes (normal e incógnito, por ejemplo), no dos pestañas que compartan sesión. También sirven dos móviles si cliente y API son accesibles desde ambos.
- A: gerente, usuario real con rol `admin` o `supervisor`. B: usuario `encargado`. Ambos deben pertenecer al mismo restaurante.
- Usar datos de prueba, no datos operativos. Mantener ambas sesiones abiertas en Tareas.
- Para el entorno local, usar `http://localhost:3000`; no alternar con `127.0.0.1`. Confirmar que la API carga antes de empezar. Dos móviles necesitan una configuración de red accesible; localhost apunta al propio móvil.
- Anotar navegador/dispositivo, usuarios, restaurante, hora, resultado esperado/obtenido e incidencias. Repetir el flujo de gerente con el otro rol elevado.

## Flujo entre gerente y encargado

1. A crea **Avería piloto: cámara frigorífica**, tipo Avería, descripción, prioridad y fecha límite. Comprobar badge Avería, estado Pendiente y evento Creada con actor y hora.
2. B debe recibirla sin recargar. Comprobar que no tiene Nueva tarea, Editar, Cancelar ni Reabrir.
3. B comenta **Revisada, pendiente de técnico**. A debe recibir exactamente un comentario con actor y hora. B completa la tarea.
4. A debe verla Completada sin recargar: comprobar quién y cuándo, también tras recargar la página. El historial conserva creación y completado.
5. A reabre con **Necesita nueva revisión**. Ambos ven Pendiente y el nuevo evento con motivo. El completado anterior sigue en el historial; los datos de completado del estado actual se limpian.
6. A edita título/descripción/prioridad/fecha/tipo de la pendiente. B comprueba que recibe los cambios. Completarla de nuevo y comprobar que ya no admite edición.
7. A crea otra tarea duplicada y la cancela con **Duplicada de la avería piloto**. Ambos ven Cancelada; no cuenta como pendiente ni vencida, y B no puede completarla.
8. A reabre la duplicada con **Comprobar duplicidad**, luego vuelve a cancelarla con **Duplicidad confirmada**. Comprobar todos los eventos y ambos motivos, incluso tras recargar. No debe existir acción de borrado.
9. Probar motivo vacío y solo espacios: no debe enviarse la transición. Comprobar filtro Canceladas y abrir el detalle de las dos tareas.

## Concurrencia

Usar un segundo encargado C del mismo restaurante. Sobre una pendiente, B y C pulsan Completar casi a la vez. Solo uno debe quedar registrado; si ambos enviaron la petición, el perdedor recibe HTTP 409 y recarga el estado actual. Puede ocurrir que Socket.IO quite antes el botón del segundo: eso es correcto, pero no prueba la carrera HTTP. La carrera HTTP está cubierta por los tests de API.

## Reconexión y online-only

1. Con B en Tareas, desconectar su conexión mediante las herramientas del navegador. Debe aparecer **Sin conexión. Tareas no está disponible**, desaparecer el listado y quedar desactivada la creación. No se deben poder completar ni comentar tareas; ninguna operación se encola.
2. Mientras B está desconectado, A crea una tarea. Restaurar conexión de B: debe cargar el listado real y mostrarla.
3. Para probar reconexión de Socket.IO **sin evento offline**, coordinar una interrupción breve y posterior reinicio de la API/Socket.IO manteniendo el navegador online y conservando base de datos/JWT. En Red, comprobar que al reconectar se produce un nuevo `GET /api/tasks`, sin recargar manualmente la página. Registrar si el socket agota sus reintentos; ese caso no equivale a una reconexión exitosa.
4. Comprobar comentarios y cambios de estado después de la reconexión. No considerar validado tiempo real solo porque una recarga manual muestre datos correctos.

## Permisos y aislamiento

- B nunca debe ver edición/cancelación/reapertura. Un intento directo autenticado a PUT de edición o POST cancel/reopen debe devolver 403 y conservar los datos.
- Una sesión de otro restaurante no debe listar estas tareas; peticiones directas sobre sus IDs deben devolver 404 sin modificar nada.
- Las acciones elevadas de crear/editar/cancelar/reabrir corresponden a admin/supervisor; completar corresponde a encargado. Comentar y leer están disponibles para las sesiones autenticadas del restaurante.

## Criterio de aceptación

Todos los pasos deben pasar en los dispositivos del piloto y quedar registrados. Si falla un paso, documentarlo y no cerrar el MVP. La carga completa de grandes listados, orden de eventos bajo latencia y comportamiento con usuarios eliminados quedan fuera de esta comprobación corta.
