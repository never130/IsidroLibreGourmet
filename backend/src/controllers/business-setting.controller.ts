import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { BusinessSetting } from '../entities/BusinessSetting';
import { BusinessSettingDto } from '../dtos/business-setting.dto';

const SETTINGS_ID = 1; // Usaremos un ID fijo para la única fila de configuración

export class BusinessSettingController {
  async getSettings(req: Request, res: Response) {
    try {
      const settingsRepository = AppDataSource.getRepository(BusinessSetting);
      let settings = await settingsRepository.findOne({ where: { id: SETTINGS_ID } });

      if (!settings) {
        // Si no existen configuraciones, podríamos devolver un objeto vacío o con valores por defecto
        // o crearlas aquí por primera vez si se prefiere.
        // Por ahora, devolvemos un objeto con valores que el frontend puede interpretar como "no configurado".
        // O podríamos devolver un 404 y que el frontend maneje la creación inicial en el primer PUT.
        // Optemos por devolver un objeto vacío o default para que el GET siempre sea exitoso tras la primera configuración.
        settings = settingsRepository.create({ id: SETTINGS_ID }); // Crea una instancia, no la guarda aún
                                                                 // El frontend podría mostrar placeholders
      }
      res.json(settings);
    } catch (error) {
      console.error('Error getting business settings:', error);
      res.status(500).json({ message: 'Error retrieving business settings' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const settingsDto = req.body as BusinessSettingDto;
      const settingsRepository = AppDataSource.getRepository(BusinessSetting);

      let settings = await settingsRepository.findOne({ where: { id: SETTINGS_ID } });

      if (!settings) {
        // Si no existe, la creamos con el ID fijo.
        settings = settingsRepository.create({ id: SETTINGS_ID, ...settingsDto });
      } else {
        // Si existe, la actualizamos.
        settingsRepository.merge(settings, settingsDto);
      }
      
      // Asegurarse de que la moneda tenga un valor si no se proporciona y es una creación
      if (!settings.currency && settingsDto.currency === undefined) {
        // Esto se maneja con el default en la entidad, pero por si acaso o si el default no se aplica en .create() directamente
        // settings.currency = Currency.MXN; // Currency debe ser importado o usar el valor string 'MXN'
      }

      const updatedSettings = await settingsRepository.save(settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating business settings:', error);
      // Considerar manejo de errores de validación si class-validator se usa a nivel de ruta/middleware
      res.status(500).json({ message: 'Error updating business settings' });
    }
  }
} 