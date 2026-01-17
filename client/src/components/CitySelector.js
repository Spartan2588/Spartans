import '../styles/components/city-selector.css';

export class CitySelector {
  render(container, onCityChange) {
    container.innerHTML = `
      <div class="city-selector">
        <label for="city-select">Select City:</label>
        <select id="city-select" class="city-select">
          <option value="1">Mumbai</option>
          <option value="2">Delhi</option>
          <option value="3">Bangalore</option>
        </select>
      </div>
    `;

    const select = container.querySelector('#city-select');
    select.addEventListener('change', (e) => {
      onCityChange(parseInt(e.target.value));
    });
  }
}
