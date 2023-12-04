// Встраиваем стили CSS
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.extension.getURL('hde_dark.css');
(document.head || document.documentElement).appendChild(style);



// Создаем элемент панели
const panel = document.createElement('div');
panel.id = 'custom-panel';
panel.innerHTML = `
    
<div class="floating-window" id="floating-window">
    <div id="panel-content">
        <button id="toggleButton"><i class="fa fa-chevron-left" id="cur"></i></button>
        <div class="info-form row">
            <div id = "rightKeywords">
                <input type="text" id="salon" placeholder="поиск по трекеру" class="form-control">
                <div id="count"></div>
            </div>
            <div class="filters">
                <div id="statusFilters" class="row form-switch mb-2"></div>
            </div>        
            <div class="tab-buttons">
                        <button class="tab-button active" data-tab="tracker_response">Результаты</button>
                        <button class="tab-button" data-tab="slack_response">Ответы Slack</button>
            </div>                    
            <div id="magicSearch">
                    <div class="tab-contents">
                        <div id="tracker_response" class="tab-content" style="display:block;">
                            <table id="result" class="table table-striped table-responsive"></table>        
                        </div>
                        <div id="slack_response" class="tab-content">
                            <table id="slackresult" class="table table-striped table-responsive"></table>        
                        </div>
                    </div>
            <div>
        </div>
    </div>
</div>

`;

// Добавляем панель на страницу
document.body.appendChild(panel);


// Получаем ссылку на поле ввода и div #magicSearch
const input = document.getElementById('salon');
const magicSearch = document.getElementById('magicSearch');

// Обработчик события нажатия клавиши "Enter" в поле ввода
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const inputValue = input.value;
    search(inputValue);
  }
});

// Функция для отправки запроса на сервер и обновления содержимого в div #magicSearch
function search(inputValue) {

var resultContainer = document.getElementById('result');

resultContainer.innerHTML = '<div class="loader"><i class="fa fa-spinner fa-spin"></i> Ждем...</div>';  
  

return fetch('https://t4u.rety87nm.ru/supersearch?text=' + encodeURIComponent(inputValue), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    .then(response => {
        if (!response.ok) {
            throw new Error('Произошла ошибка. Статус: ' + response.status);
        }
        return response.json();
    })

    .then(data => {
        let table = document.getElementById('result');
        let slackTable = document.getElementById('slackresult');

        // Очистка содержимого таблицы
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }


        data.yandexdata.forEach(item => {
            let row = table.insertRow();
            let keyCell = row.insertCell();
            let descriptionCell = row.insertCell();
            let statusCell = row.insertCell();
            keyCell.innerHTML = item.key;
            descriptionCell.innerHTML = item.summary;
            statusCell.innerHTML = item.status;
        });

        while (slackTable.firstChild) {
            slackTable.removeChild(slackTable.firstChild);
        }

        // Заполнение таблицы данных из Slack
        data.slackdata.forEach(item => {
            let row = slackTable.insertRow();
            let keyCell = row.insertCell();
            let descriptionCell = row.insertCell();
            let statusCell = row.insertCell();
            keyCell.innerHTML = item.text;
            descriptionCell.innerHTML = item.channel;

            statusCell.innerHTML =  `<a href="${item.link}" target=_blank >ссылка</a>`;
        });



        createStatusFilter(data.statuses);
         applyFilters()

        // Выводим значение count на страницу
        document.getElementById('count').innerHTML = data.count;
    })
    .catch(error => {
        // Очищаем контейнер от предыдущих данных
        resultContainer.innerHTML = '';

        // Вставляем сообщение об ошибке
        resultContainer.innerHTML = 'Произошла ошибка: ' + error.message;
    });
}




function createStatusFilter(statuses) {
    let statusFiltersContainer = document.getElementById('statusFilters');

    // Очистка содержимого контейнера фильтров
    statusFiltersContainer.innerHTML = '';

    // Создание чекбоксов и меток для каждого статуса
    statuses.forEach((status, index) => {
        let formCheck = document.createElement('div');
        formCheck.classList.add('col-md-3', 'col-sm-12', 'form-check', 'form-switch', 'mb-2');

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'status';
        checkbox.classList.add('form-check-input');
        checkbox.value = status;
        checkbox.id = 'flexSwitch' + index;
        checkbox.checked = false; // Установите значение true или false, в зависимости от вашего выбора.
        checkbox.addEventListener('change', applyFilters);

        let label = document.createElement('label');
        label.classList.add('form-check-label');
        label.setAttribute('for', 'flexSwitch' + index);
        label.textContent = status;

        formCheck.appendChild(checkbox);
        formCheck.appendChild(label);

        statusFiltersContainer.appendChild(formCheck);
    });
}



function applyFilters() {
    let table = document.getElementById('result');
    let countContainer = document.getElementById('count');

    let statusFilter = []; // Array to store selected status values
    // Get the selected status checkboxes and populate the statusFilter array
    let checkboxes = document.querySelectorAll('input[name="status"]:checked');
    let backlog = document.querySelectorAll('input[value="Backlog"]');
    backlog.forEach(checkbox => {
        statusFilter.push(checkbox.value);
    });

    let filteredCount = 0;

    // Iterate over table rows and apply filters
    for (let i = 0; i < table.rows.length; i++) {
        let row = table.rows[i];
        let statusCell = row.cells[2];
        let statusValue = statusCell.innerHTML.trim();

        // Check if the row matches the filter
        if (statusFilter.includes(statusValue)) {
            row.style.display = 'table-row';
            filteredCount++;
        } else {
            row.style.display = 'none';
        }
    }

    // Display the count of filtered rows
    countContainer.textContent = filteredCount;
}

// Добавьте обработчик события изменения состояния чекбоксов
document.querySelectorAll('#statusFilters input[name="status"]').forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
});





// Обработчик клика по кнопке "Скрыть/Показать"
const toggleButton = document.getElementById('toggleButton');
const chevron = document.getElementById('cur');
const panelContent = document.getElementById('floating-window');
let isHidden = JSON.parse(localStorage.getItem('panelHidden')) || false;

function setPanelState(hidden) {
  isHidden = hidden;
  if (isHidden) {
    
    panelContent.classList.add('hidden');
    panelContent.classList.remove('visible');
    chevron.classList.remove('open');
  } else {
    
    panelContent.classList.add('visible');
    panelContent.classList.remove('hidden');
    chevron.classList.add('open');
  }
  localStorage.setItem('panelHidden', JSON.stringify(isHidden));
}

toggleButton.addEventListener('click', () => {
  setPanelState(!isHidden);
});

// Инициализация состояния панели
setPanelState(isHidden);


    var floatingWindow = document.getElementById('floating-window');
        var isMouseDown = false;
        var xOffset = 0;
        var yOffset = 0;

        // Добавляем обработчики событий при перетаскивании мышью
        floatingWindow.addEventListener('mousedown', function(event) {
            isMouseDown = true;
            xOffset = event.clientX - floatingWindow.offsetLeft;
            
        });

        floatingWindow.addEventListener('mouseup', function() {
            isMouseDown = false;
        });

        floatingWindow.addEventListener('mousemove', function(event) {
            if (isMouseDown) {
                floatingWindow.style.left = (event.clientX - xOffset) + 'px';
                
            }
        });





// табы для выдачи

function initTabs() {
  const tabButtons = document.getElementsByClassName('tab-button');
  const tabContents = document.getElementsByClassName('tab-content');

  // Скрыть все таблицы, кроме первой
  for (let i = 1; i < tabContents.length; i++) {
    tabContents[i].style.display = 'none';
  }

  // Обработчики событий для кнопок-табов
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].addEventListener('click', function() {
      for (let j = 0; j < tabButtons.length; j++) {
        tabButtons[j].classList.remove('active');
      }

      // Добавить класс "active" к выбранной кнопке-табу
      this.classList.add('active');

      // Скрыть все таблицы
      for (let j = 0; j < tabContents.length; j++) {
        tabContents[j].style.display = 'none';
      }



      // Показать выбранную таблицу
      const tabToShow = this.getAttribute('data-tab');
      document.getElementById(tabToShow).style.display = 'block';
    });
  }
}


// Вызов функции для инициализации табов
initTabs();        