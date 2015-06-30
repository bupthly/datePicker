(function() {
	var $ = function(id) {
		return document.getElementById(id);
	}
	var $$ = function(container, className) {
		return container.querySelector(className);
	}
	var week = ['Su', 'Mon', 'Tu', 'Wed', 'Th', 'Fr', 'Sa'];
	var today = new Date();
	var year = today.getFullYear();
	var month = today.getMonth();
	var day = today.getDate();
	var yearSelect = $('year');
	var monthSelect = $('month');
	var tbody = $$(document.body, '.tbody');

	//初始化当前月份的日期
	var initDay = function(year, month) {
		var d = new Date(year, month, 1);  //本月第一天
		var dW = d.getDay();   //本月第一天是周几
		var d1 = new Date(year, month + 1, 0);  
		var dM = d1.getDate();    //本月的天数
		
		var rowArr = [];
		//第一行
		var row = createRow();
		for(var i = 0; i < dW; i++) {
			var cell = createCell('');
			row.appendChild(cell);
		}
		for(; i < 7; i++) {
			var cell = createCell(i - dW + 1);
			row.appendChild(cell);
		}
		rowArr.push(row);

		//后面几行， 剩余天数
		var dayRemain = dM - (7 - dW);
		var rowNum = Math.floor(dayRemain / 7);
		var dayL = dayRemain % 7;
		for(i = 0; i < rowNum; i++) {
			var row = createRow();

			for(var j = 0; j < 7; j++) {
				var cell = createCell(i * 7 + j + (7 - dW) + 1);
				row.appendChild(cell);
			}

			rowArr.push(row);
		}

		//最后一行
		row = createRow();
		for(i = 0; i < 7; i++) {
			
			var cell;

			if (i < dayL) cell = createCell(dM - dayL + 1 + i);
			else cell = createCell('');

			row.appendChild(cell);

		}

		rowArr.push(row);

		return rowArr;
	}

	var initTbody = function() {
		
		var row = createRow();
		for(var t = 0; t < week.length; t++) {
			var cell = createCell(week[t]);
			row.appendChild(cell);
		}
		tbody.appendChild(row);
		var rowArr = initDay(year, month);
		for(var i = 0, len = rowArr.length; i < len; i++) {
			tbody.appendChild(rowArr[i]);
		}

		yearSelect.value = year;
		monthSelect.value = month + 1;
	}

	function createRow() {
		var row = document.createElement('div');
		row.classList.add('row');
		return row;
	}
	function createCell(value) {
		var cell = document.createElement('span');
		cell.classList.add('cell');
		cell.innerHTML = value;
		if(value === day) cell.classList.add('active');
		return cell;
	}

	function initCap() {

	}

	function addListener(o, e, fn) {
		o.addEventListener ? o.addEventListener(e, fn) 
			: (o.attachEvent ? o.attachEvent('on' + e, fn) : o['on' + e] = fn);
	}

	function bindEvents() {
		addListener(yearSelect, 'change', function() {
			var newYear = this.value;
			var month = monthSelect.value - 1;
			update(newYear, month);
		});

		addListener(monthSelect, 'change', function() {
			var year = yearSelect.value;
			var newMonth = monthSelect.value - 1;
			update(year, newMonth);
		});
	}

	function update(year, month) {
		var rowArr = initDay(year, month);
		var len = tbody.children.length;
		for(var i = 0; i < len - 1; i++) {
			tbody.lastChild.remove();
		}

		for(i = 0; i < rowArr.length; i++) {
			tbody.appendChild(rowArr[i]);
		}		
	}

	initTbody();
	bindEvents();
	
})();