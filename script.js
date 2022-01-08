function loadApplication () {
  let state = {
    restaurants: []
  };

  function setState (data) {
    state = Object.assign(state, data);

    console.log('State Update:', state);

    render(state);
  }

  function render (data) {
    renderRestaurants(data.restaurants);
    renderActiveRestaurant(data.activeRestaurant);
  }

  function renderRestaurants (list) {
    const CONTAINER_ID = 'restaurants';
    const container = document.getElementById(CONTAINER_ID);

    container.textContent = '';

    for (let item of list) {
      const element = document.createElement('li');

      element.textContent = item.title;
      element.classList.add('restaurant-li');
      element.addEventListener('click', () => {
        updateActiveRestaurant(item);
      });

      container.appendChild(element);
    }
  }

  function renderActiveRestaurant (activeRestaurant) {
    if (!activeRestaurant) { return; }

    const activeRestaurantEl = document.getElementById('active-restaurant');
    activeRestaurantEl.textContent = '';

    // Create a line seperator
    activeRestaurantEl.appendChild(document.createElement('hr'));
    
    // Create heading element
    const headingElement = document.createElement('h1');
    headingElement.textContent = activeRestaurant.title;
    activeRestaurantEl.appendChild(headingElement);

    // Create new menu item form
    const menuFormEl = document.getElementById('new-menu');
    menuFormEl.removeAttribute('hidden');

    // Create menus list
    if (activeRestaurant.menus && activeRestaurant.menus.length > 0) {
      const listEl = document.createElement('ul');

      for (let menu of activeRestaurant.menus) {
        const listItemEl = document.createElement('li');

        listItemEl.textContent = menu.title;
        listItemEl.classList.add("menu-item-li");

        if (menu.items && menu.items.length > 0) {
          const itemsListEl = document.createElement('ul');

          for (let menuItem of menu.items) {
            const menuItemEl = document.createElement('li');

            menuItemEl.textContent = `${menuItem.itemName} : Rs. ${menuItem.price}`;
            menuItemEl.classList.add("menu-item-li");

            itemsListEl.appendChild(menuItemEl);
          }

          listItemEl.appendChild(itemsListEl);
        }

        listEl.appendChild(listItemEl);
      }

      activeRestaurantEl.appendChild(listEl);
    }

    
    // Toggle menu item form
    const menuItemFormEl = document.getElementById('new-menu-item');
    if (activeRestaurant.menus && activeRestaurant.menus.length > 0) {
      const menuSelectEl = document.getElementById('item-menu');

      menuItemFormEl.removeAttribute('hidden');
      menuSelectEl.textContent = "";

      for (let menu of activeRestaurant.menus) {
        const optionEl = document.createElement('option');

        optionEl.setAttribute('value', menu.menuId);
        optionEl.innerText = menu.title;

        menuSelectEl.appendChild(optionEl);
      }
    }
    else {
      menuItemFormEl.setAttribute('hidden', true);
    }
    
  }

  function getRestaurants () {
    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    
    return fetch("http://localhost:5000/restaurant", requestOptions)
      .then(response => response.json());
  }

  function updateActiveRestaurant (activeRestaurant) {
    getMenus(activeRestaurant.rId).then((menus) => {
      const restaurant = Object.assign(activeRestaurant, { menus: menus });

      setState({ activeRestaurant: restaurant })
    });
  }

  function createNewRestaurant (title) {
    const reqHeaders = new Headers();
    const raw = JSON.stringify({
      "title": title
    });

    reqHeaders.append("Content-Type", "application/json");

    var requestOptions = {
      method: 'POST',
      headers: reqHeaders,
      body: raw
    };

    return fetch("http://localhost:5000/restaurant", requestOptions)
      .then(response => response.json());
  }

  function createNewMenu (title, rId) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      "title": title,
      "rId": rId
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw
    };

    return fetch("http://localhost:5000/menu", requestOptions)
      .then(response => response.json());
  }

  function getMenuItems (menuId) {
    var requestOptions = {
      method: 'GET'
    };
    
    return fetch(`http://localhost:5000/menu/${menuId}/item`, requestOptions)
      .then(response => response.json());
  }

  function getMenus (rId) {
    var requestOptions = {
      method: 'GET'
    };
    
    return fetch(`http://localhost:5000/restaurant/${rId}/menu`, requestOptions)
      .then(response => response.json())
      .then(data => {
        const menus = data.menus;

        return Promise.all(menus.map((menu) => {
          return getMenuItems(menu.menuId).then((data) => {
            return {
              title: menu.title,
              rId: menu.rId,
              menuId: menu.menuId,
              items: data.items
            }
          })
        }));
      });
  }

  function createNewMenuItem (title, price, menu) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      title: title,
      price: price
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw
    };

    return fetch(`http://localhost:5000/menu/${menu}/item`, requestOptions)
      .then(response => response.json());
  }

  document.getElementById('new-restaurant').addEventListener('submit', (e) => {
    e.preventDefault();

    const inputElement = document.getElementById('restaurant-title');
    const restaurantTitle = inputElement.value;

    if (!restaurantTitle || restaurantTitle === '') {
      window.alert('Restaurant title is required');

      return;
    }

    createNewRestaurant(restaurantTitle)
      .then(() => getRestaurants())
      .then((data) => setState({ restaurants: data.restaurants }))
      .then(() => {
        inputElement.value = "";
      }); 
  });

  document.getElementById('new-menu').addEventListener('submit', (e) => {
    e.preventDefault();

    const inputElement = document.getElementById('menu-title');
    const menuTitle = inputElement.value;

    if (!menuTitle || menuTitle === '') {
      window.alert('Menu title is required');

      return;
    }

    createNewMenu(menuTitle, state.activeRestaurant.rId)
      .then((newMenuItem) => {
        inputElement.value = '';
        
        const updatedActiveRestaurant = state.activeRestaurant;

        updatedActiveRestaurant.menus.push(newMenuItem);

        setState({ activeRestaurant: updatedActiveRestaurant });
      });
  });

  document.getElementById('new-menu-item').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('item-name').value;
    const price = parseInt(document.getElementById('item-price').value, 10);
    const menu = parseInt(document.getElementById('item-menu').value, 10);
  
    createNewMenuItem(name, price, menu)
      .then((newItem) => {
        const activeRestaurant = state.activeRestaurant;

        for (let menuIdx in activeRestaurant.menus) {
          const menuItem = activeRestaurant.menus[menuIdx];

          if (menuItem.menuId !== menu) { continue; }

          !activeRestaurant.menus[menuIdx].items && (activeRestaurant.menus[menuIdx].items = []);

          activeRestaurant.menus[menuIdx].items.push(newItem);
        }

        document.getElementById('item-name').value = ''
        document.getElementById('item-price').value = ''
        document.getElementById('item-menu').value = ''

        setState({ activeRestaurant });
      });
  });

  getRestaurants()
    .then((data) => {
      setState({ restaurants: data.restaurants })
    });
}

loadApplication();