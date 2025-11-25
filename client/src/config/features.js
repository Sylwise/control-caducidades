export const FEATURES = {
  OFFLINE_MODE: true,
  OFFLINE_SYNC: true,
  LOCAL_CLASSIFICATION: true,
};

class FeatureManager {
  static features = FEATURES;

  static isEnabled(feature) {
    return this.features[feature] === true;
  }

  static async enableFeature(feature) {
    if (!(feature in this.features)) {
      throw new Error(`Feature "${feature}" no existe`);
    }
    this.features[feature] = true;
    await this.notifyFeatureChange(feature, true);
  }

  static async disableFeature(feature) {
    if (!(feature in this.features)) {
      throw new Error(`Feature "${feature}" no existe`);
    }
    this.features[feature] = false;
    await this.notifyFeatureChange(feature, false);
  }

  static async notifyFeatureChange(feature, enabled) {
    console.log(`Feature "${feature}" ${enabled ? "activada" : "desactivada"}`);
    // Aquí podemos añadir analytics o notificaciones
  }
}

export default FeatureManager;
