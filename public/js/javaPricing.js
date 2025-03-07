function updatePrices(duration) {
    // Get all price elements
    const prices = document.querySelectorAll('.discounted-price');
  
    // Define discount multipliers
    let discountMultiplier = 1;
    switch (duration) {
      case 'quarterly':
        discountMultiplier = 0.9; // 10% discount
        break;
      case 'semi-annually':
        discountMultiplier = 0.8; // 20% discount
        break;
      case 'annually':
        discountMultiplier = 0.75; // 25% discount
        break;
      default:
        discountMultiplier = 1; // No discount for monthly
    }
  
    // Update prices
    prices.forEach(priceElement => {
      const basePrice = parseFloat(priceElement.getAttribute('data-monthly'));
      const newPrice = (basePrice * discountMultiplier).toFixed(2);
      priceElement.innerHTML = `$${newPrice} USD <span class="per-month">/${duration}</span>`;
    });
  }
  
  const buttons = document.querySelectorAll('.duration-buttons button');
  buttons.forEach(button => {
    button.addEventListener('click', function () {
      buttons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });
    