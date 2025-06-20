// Sistema de filtrado por ubicación - Fructus Via
class LocationFilter {
  constructor() {
    this.locations = [];
    this.currentLocation = null;
    this.init();
  }

  // Inicializar el sistema
  init() {
    this.loadLocations();
    this.detectUserLocation();
    this.setupEventListeners();
  }

  // Cargar ubicaciones dinámicamente desde Shopify
  loadLocations() {
    // Este objeto será generado por Liquid en el tema
    if (window.shopLocations) {
      this.locations = window.shopLocations;
    }
  }

  // Detectar ubicación del usuario
  detectUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => this.handleGeolocationSuccess(position),
        () => this.showPostalCodePopup()
      );
    } else {
      this.showPostalCodePopup();
    }
  }

  // Manejar geolocalización exitosa
  handleGeolocationSuccess(position) {
    // Aquí podrías usar un servicio de geocoding
    // Por ahora, mostrar popup
    this.showPostalCodePopup();
  }

  // Mostrar popup para código postal
  showPostalCodePopup() {
    const postalCode = prompt("Ingresa tu código postal para ver productos disponibles:");
    if (postalCode) {
      this.filterByPostalCode(postalCode.trim());
    }
  }

  // Filtrar por código postal
  filterByPostalCode(postalCode) {
    const location = this.findLocationByPostalCode(postalCode);
    
    if (location) {
      this.currentLocation = location;
      this.showProductsForLocation(location.name);
      this.showLocationMessage(location);
    } else {
      this.showNoDeliveryMessage(postalCode);
      this.hideAllProducts();
    }
  }

  // Buscar ubicación por código postal
  findLocationByPostalCode(postalCode) {
    return this.locations.find(location => location.zip === postalCode);
  }

  // Mostrar solo productos de una ubicación
  showProductsForLocation(locationName) {
    const products = document.querySelectorAll('.product-item');
    let visibleCount = 0;

    products.forEach(product => {
      const productLocation = product.dataset.sucursal;
      
      if (productLocation === locationName) {
        product.style.display = 'block';
        visibleCount++;
      } else {
        product.style.display = 'none';
      }
    });

    console.log(`Mostrando ${visibleCount} productos para ${locationName}`);
  }

  // Ocultar todos los productos
  hideAllProducts() {
    document.querySelectorAll('.product-item').forEach(product => {
      product.style.display = 'none';
    });
  }

  // Mostrar mensaje de ubicación actual
  showLocationMessage(location) {
    const message = `Productos disponibles en: ${location.name} (${location.city})`;
    this.displayMessage(message, 'success');
  }

  // Mostrar mensaje de no entrega
  showNoDeliveryMessage(postalCode) {
    const message = `Lo sentimos, no tenemos entrega en el código postal: ${postalCode}`;
    this.displayMessage(message, 'error');
  }

  // Mostrar mensaje en pantalla
  displayMessage(text, type) {
    // Crear o actualizar elemento de mensaje
    let messageEl = document.getElementById('location-message');
    
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'location-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: bold;
      `;
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = text;
    messageEl.className = `location-message ${type}`;
    
    // Estilos según tipo
    if (type === 'success') {
      messageEl.style.backgroundColor = '#4CAF50';
      messageEl.style.color = 'white';
    } else {
      messageEl.style.backgroundColor = '#f44336';
      messageEl.style.color = 'white';
    }

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      if (messageEl) messageEl.remove();
    }, 5000);
  }

  // Configurar event listeners
  setupEventListeners() {
    // Botón para cambiar ubicación
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('change-location-btn')) {
        this.showPostalCodePopup();
      }
    });
  }

  // Método público para cambiar ubicación
  changeLocation() {
    this.showPostalCodePopup();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.locationFilter = new LocationFilter();
});

// Función global para cambiar ubicación
function changeLocation() {
  if (window.locationFilter) {
    window.locationFilter.changeLocation();
  }
}
