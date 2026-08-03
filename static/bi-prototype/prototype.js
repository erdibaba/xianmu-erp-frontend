(function () {
  'use strict'

  var palette = ['#1e6bd6', '#0ea57a', '#aab6c6']
  var currentView = 'overview'
  var builderState = {
    dataset: 'inventory',
    chart: 'bar',
    color: '#1e6bd6',
    dimensions: ['产品'],
    metrics: ['采购重量', '销售重量', '可售库存重量']
  }

  var datasets = {
    inventory: {
      dimensions: ['产品', '确认函合同号', '仓库', '货权', '厂号', '温区', '入库日期'],
      metrics: ['采购重量', '采购箱数', '销售重量', '销售箱数', '可售库存重量', '可售库存箱数', '报损重量', '库存成本']
    },
    finance: {
      dimensions: ['资方', '确认函合同号', '付款主体', '贷款日期', '还款日期', '还款状态'],
      metrics: ['贷款金额', '已还本金', '贷款余额', '累计利息', '手续费', '仓储费用', '预计应付金额']
    },
    cost: {
      dimensions: ['确认函合同号', '成本日期', '业务主体', '资方', '产品'],
      metrics: ['含税采购金额', '资金利息', '仓储费', '其他费用', '当日成本', '累计成本', '单位成本']
    },
    sales: {
      dimensions: ['二批商', '销售', '销售合同号', '产品', '仓库', '出库日期'],
      metrics: ['销售重量', '销售箱数', '销售金额', '二批费用', '毛利金额', '毛利率']
    }
  }

  var flowData = {
    labels: ['2月', '3月', '4月', '5月', '6月', '7月'],
    series: [[156, 188, 172, 241, 266, 284], [98, 126, 144, 168, 205, 232], [118, 126, 154, 227, 288, 302]]
  }
  var inventoryData = {
    labels: ['27944', '24314', '59254', '27918', '53035', '27899', '63819', '60240'],
    series: [[126, 99, 86, 78, 72, 64, 58, 49], [93, 71, 65, 52, 49, 44, 37, 31], [34, 28, 21, 26, 23, 20, 21, 18]]
  }
  var loanData = {
    labels: ['2月', '3月', '4月', '5月', '6月', '7月'],
    series: [[420, 680, 510, 930, 760, 868], [80, 150, 210, 260, 294, 310], [340, 870, 1170, 1840, 2306, 2864]]
  }

  function byId (id) { return document.getElementById(id) }
  function all (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)) }

  function showToast (message) {
    var toast = byId('toast')
    toast.querySelector('p').textContent = message
    toast.classList.add('show')
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(function () { toast.classList.remove('show') }, 2400)
  }

  function renderSparklines () {
    all('.sparkline').forEach(function (el) {
      var points = el.dataset.points.split(',').map(Number)
      var max = Math.max.apply(null, points)
      var width = 180
      var height = 30
      var coords = points.map(function (value, index) {
        return (index * width / (points.length - 1)) + ',' + (height - value / max * 24)
      })
      el.innerHTML = '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none"><path class="area" d="M' + coords.join(' L') + ' L' + width + ',' + height + ' L0,' + height + ' Z"></path><path class="line" d="M' + coords.join(' L') + '"></path></svg>'
    })
  }

  function renderBarChart (target, data, colors) {
    var el = typeof target === 'string' ? byId(target) : target
    if (!el) return
    colors = colors || palette
    var max = Math.max.apply(null, [].concat.apply([], data.series))
    el.innerHTML = '<div class="bar-chart">' + data.labels.map(function (label, index) {
      var bars = data.series.map(function (series, seriesIndex) {
        var height = Math.max(6, series[index] / max * 84)
        return '<i class="bar" style="--height:' + height + '%;--color:' + colors[seriesIndex % colors.length] + '"></i>'
      }).join('')
      return '<div class="bar-group" data-label="' + label + '">' + bars + '<span class="bar-value" style="--height:' + (data.series[0][index] / max * 84) + '%">' + data.series[0][index] + '</span><label>' + label + '</label></div>'
    }).join('') + '</div>'
    all('.bar-group', el).forEach(function (group) {
      group.addEventListener('click', function () {
        showDrawer(group.dataset.label + ' 数据明细')
      })
    })
  }

  function renderLineChart (target, data, colors) {
    var el = typeof target === 'string' ? byId(target) : target
    if (!el) return
    colors = colors || palette
    var max = Math.max.apply(null, [].concat.apply([], data.series))
    var width = 700
    var height = 210
    var lines = data.series.map(function (series, seriesIndex) {
      var coords = series.map(function (value, index) {
        var x = index * width / (series.length - 1)
        var y = height - value / max * (height - 25)
        return { x: x, y: y, value: value }
      })
      return '<polyline points="' + coords.map(function (p) { return p.x + ',' + p.y }).join(' ') + '" stroke="' + colors[seriesIndex % colors.length] + '"></polyline>' + coords.map(function (p) { return '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="' + colors[seriesIndex % colors.length] + '"><title>' + p.value + '</title></circle>' }).join('')
    }).join('')
    el.innerHTML = '<div class="line-chart"><svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' + lines + '</svg><div class="line-labels">' + data.labels.map(function (label) { return '<span>' + label + '</span>' }).join('') + '</div></div>'
  }

  function renderPieChart (target, data, color) {
    var el = typeof target === 'string' ? byId(target) : target
    if (!el) return
    var values = data.series[0]
    var sum = values.reduce(function (a, b) { return a + b }, 0)
    var cursor = 0
    var colors = [color || '#1e6bd6', '#0ea57a', '#f0a43c', '#7d8fa8', '#53a5ee', '#51c4a1', '#e9c56d', '#9ba8ba']
    var segments = values.map(function (value, index) {
      var start = cursor
      cursor += value / sum * 100
      return colors[index % colors.length] + ' ' + start + '% ' + cursor + '%'
    }).join(',')
    el.innerHTML = '<div class="donut-wrap"><div class="donut-chart" style="background:conic-gradient(' + segments + ')"><div><strong>' + sum.toFixed(0) + '</strong><span>指标合计</span></div></div><div class="donut-legend">' + data.labels.slice(0, 6).map(function (label, index) { return '<button><i style="background:' + colors[index] + '"></i><span>' + label + '</span><b>' + Math.round(values[index] / sum * 100) + '%</b></button>' }).join('') + '</div></div>'
  }

  function renderTable (target, data) {
    var el = typeof target === 'string' ? byId(target) : target
    if (!el) return
    el.innerHTML = '<div class="table-preview"><table><thead><tr><th>维度</th><th>采购重量</th><th>销售重量</th><th>库存重量</th></tr></thead><tbody>' + data.labels.map(function (label, index) { return '<tr><td>' + label + '</td><td>' + (data.series[0][index] || 0) + '</td><td>' + (data.series[1] ? data.series[1][index] : '-') + '</td><td>' + (data.series[2] ? data.series[2][index] : '-') + '</td></tr>' }).join('') + '</tbody></table></div>'
  }

  function renderKpi (target, data) {
    var el = typeof target === 'string' ? byId(target) : target
    var sum = data.series[0].reduce(function (a, b) { return a + b }, 0)
    el.innerHTML = '<div class="kpi-preview"><div><strong>' + sum.toLocaleString() + '</strong><span>所选指标合计</span></div></div>'
  }

  function renderChart (target, type, data, color) {
    if (type === 'line') renderLineChart(target, data, [color || '#1e6bd6', '#0ea57a', '#aab6c6'])
    else if (type === 'pie') renderPieChart(target, data, color)
    else if (type === 'table') renderTable(target, data)
    else if (type === 'kpi') renderKpi(target, data)
    else renderBarChart(target, data, [color || '#1e6bd6', '#0ea57a', '#aab6c6'])
  }

  function renderStaticWidgets () {
    renderSparklines()
    renderChart('flowChart', 'bar', flowData)
    renderChart('inventoryMainChart', 'bar', inventoryData)
    renderChart('loanChart', 'bar', loanData)
    byId('fundWaterfall').innerHTML = [
      ['累计融资', 94, '#1e6bd6', '4,168'], ['累计还款', 52, '#0ea57a', '1,304'], ['贷款余额', 75, '#f0a43c', '2,864'], ['资金成本', 18, '#78889f', '86.7']
    ].map(function (item) { return '<div class="water-item" style="--height:' + item[1] + '%;--color:' + item[2] + '"><span>' + item[3] + '</span><label>' + item[0] + '</label></div>' }).join('')
    byId('ageBars').innerHTML = [
      ['0-30天', 72, '#1e6bd6', '196.8t'], ['31-60天', 48, '#0ea57a', '121.5t'], ['61-90天', 27, '#f0a43c', '68.2t'], ['90天以上', 11, '#df645f', '26.1t']
    ].map(function (item) { return '<div class="age-row"><span>' + item[0] + '</span><div class="age-track"><i style="--width:' + item[1] + '%;--color:' + item[2] + '"></i></div><b>' + item[3] + '</b></div>' }).join('')
  }

  function switchView (view) {
    currentView = view
    all('.nav-item').forEach(function (item) { item.classList.toggle('active', item.dataset.view === view) })
    all('.view').forEach(function (section) { section.classList.toggle('active', section.id === 'view-' + view) })
    var titleMap = { overview: '经营驾驶舱', inventory: '进销存分析', finance: '融资与财务', builder: '自助报表设计' }
    byId('pageTitle').textContent = titleMap[view]
    byId('globalFilters').style.display = view === 'builder' ? 'none' : 'flex'
    window.scrollTo(0, 0)
  }

  function bindNavigation () {
    all('.nav-item').forEach(function (item) { item.addEventListener('click', function () { switchView(item.dataset.view) }) })
    all('.template-link, .report-list > button').forEach(function (item) {
      item.addEventListener('click', function () { openBuilder('inventory', item.dataset.template || '自定义报表') })
    })
  }

  function bindChartSwitches () {
    all('.chart-switch').forEach(function (switcher) {
      switcher.addEventListener('click', function (event) {
        var button = event.target.closest('button')
        if (!button) return
        all('button', switcher).forEach(function (item) { item.classList.toggle('active', item === button) })
        var target = switcher.dataset.target
        var data = target === 'flowChart' ? flowData : target === 'inventoryMainChart' ? inventoryData : loanData
        renderChart(target, button.dataset.chart, data)
      })
    })
  }

  function showDrawer (title) {
    byId('detailDrawer').querySelector('h2').textContent = title || '数据明细'
    byId('detailDrawer').classList.add('open')
    byId('detailDrawer').setAttribute('aria-hidden', 'false')
  }

  function renderFieldList () {
    var dataset = datasets[builderState.dataset]
    var search = byId('fieldSearch').value.trim().toLowerCase()
    var fields = dataset.dimensions.map(function (name) { return { name: name, type: 'dimension' } }).concat(dataset.metrics.map(function (name) { return { name: name, type: 'metric' } }))
    fields = fields.filter(function (field) { return !search || field.name.toLowerCase().indexOf(search) >= 0 })
    byId('fieldList').innerHTML = fields.map(function (field) {
      var selected = (field.type === 'dimension' ? builderState.dimensions : builderState.metrics).indexOf(field.name) >= 0
      return '<button class="field-item ' + field.type + (selected ? ' selected' : '') + '" data-name="' + field.name + '" data-type="' + field.type + '"><span class="field-type">' + (field.type === 'dimension' ? '维' : '∑') + '</span><span>' + field.name + '</span></button>'
    }).join('')
    all('.field-item', byId('fieldList')).forEach(function (item) {
      item.addEventListener('click', function () { toggleField(item.dataset.name, item.dataset.type) })
    })
    renderZones()
  }

  function toggleField (name, type) {
    var list = type === 'dimension' ? builderState.dimensions : builderState.metrics
    var index = list.indexOf(name)
    if (index >= 0) list.splice(index, 1)
    else {
      if (type === 'dimension' && list.length >= 2) list.shift()
      if (type === 'metric' && list.length >= 3) list.shift()
      list.push(name)
    }
    renderFieldList()
    renderBuilderPreview()
  }

  function renderZones () {
    function zoneHtml (items, type) {
      return items.map(function (name) { return '<span class="zone-chip">' + name + '<button data-name="' + name + '" data-type="' + type + '">×</button></span>' }).join('')
    }
    byId('dimensionZone').innerHTML = zoneHtml(builderState.dimensions, 'dimension')
    byId('metricZone').innerHTML = zoneHtml(builderState.metrics, 'metric')
    all('.zone-chip button').forEach(function (button) { button.addEventListener('click', function () { toggleField(button.dataset.name, button.dataset.type) }) })
  }

  function previewData () {
    if (builderState.dataset === 'finance') return loanData
    if (builderState.dataset === 'cost') return { labels: ['7/25', '7/26', '7/27', '7/28', '7/29', '7/30'], series: [[18, 21, 19, 24, 27, 31], [6, 8, 7, 9, 11, 12], [3, 4, 4, 5, 5, 6]] }
    if (builderState.dataset === 'sales') return { labels: ['南京张涛', '北京卓宸', '上海超跃', '天津万疆', '厦门万翔'], series: [[126, 98, 86, 72, 58], [92, 74, 63, 49, 41], [34, 24, 23, 23, 17]] }
    return inventoryData
  }

  function renderBuilderPreview () {
    byId('previewTitle').textContent = byId('reportName').value || '未命名分析'
    byId('previewSubtitle').textContent = (builderState.dimensions.join('、') || '未选维度') + ' × ' + (builderState.metrics.join('、') || '未选指标')
    renderChart('builderPreview', builderState.chart, previewData(), builderState.color)
  }

  function resetBuilderForDataset (dataset) {
    builderState.dataset = dataset
    var config = datasets[dataset]
    builderState.dimensions = [config.dimensions[0]]
    builderState.metrics = config.metrics.slice(0, 3)
    byId('datasetSelect').value = dataset
    renderFieldList()
    renderBuilderPreview()
  }

  function openBuilder (dataset, reportName) {
    byId('builderModal').classList.add('open')
    byId('builderModal').setAttribute('aria-hidden', 'false')
    byId('reportName').value = reportName || (dataset === 'finance' ? '融资还款分析' : dataset === 'cost' ? '合同成本趋势' : '产品进销存分析')
    resetBuilderForDataset(dataset || 'inventory')
  }

  function closeBuilder () {
    byId('builderModal').classList.remove('open')
    byId('builderModal').setAttribute('aria-hidden', 'true')
  }

  function bindBuilder () {
    byId('openBuilder').addEventListener('click', function () { openBuilder('inventory') })
    byId('newBlankReport').addEventListener('click', function () { openBuilder('inventory', '未命名分析') })
    byId('blankTemplate').addEventListener('click', function () { openBuilder('inventory', '未命名分析') })
    all('[data-start-template]').forEach(function (button) { button.addEventListener('click', function () { openBuilder(button.dataset.startTemplate) }) })
    byId('closeBuilder').addEventListener('click', closeBuilder)
    byId('cancelBuilder').addEventListener('click', closeBuilder)
    byId('datasetSelect').addEventListener('change', function () { resetBuilderForDataset(this.value) })
    byId('fieldSearch').addEventListener('input', renderFieldList)
    byId('reportName').addEventListener('input', renderBuilderPreview)
    byId('chartPicker').addEventListener('click', function (event) {
      var button = event.target.closest('button')
      if (!button) return
      builderState.chart = button.dataset.chart
      all('button', byId('chartPicker')).forEach(function (item) { item.classList.toggle('active', item === button) })
      renderBuilderPreview()
    })
    all('.color-options button').forEach(function (button) {
      button.addEventListener('click', function () {
        all('.color-options button').forEach(function (item) { item.classList.toggle('active', item === button) })
        builderState.color = getComputedStyle(button).getPropertyValue('--color').trim()
        renderBuilderPreview()
      })
    })
    byId('saveTemplate').addEventListener('click', function () {
      var name = byId('reportName').value || '未命名分析'
      closeBuilder()
      switchView('builder')
      showToast('模板“' + name + '”已保存（原型演示）')
    })
    byId('previewFull').addEventListener('click', function () { showToast('已进入全屏预览模式（原型演示）') })
  }

  function bindGeneralActions () {
    byId('applyFilters').addEventListener('click', function () { showToast('筛选条件已应用，图表已刷新') })
    byId('refreshButton').addEventListener('click', function () {
      this.classList.add('spinning')
      var button = this
      window.setTimeout(function () { button.classList.remove('spinning'); renderStaticWidgets(); showToast('演示数据已刷新') }, 450)
    })
    all('[data-action="detail"]').forEach(function (button) { button.addEventListener('click', function () { showDrawer('数据明细') }) })
    all('[data-action="export"]').forEach(function (button) { button.addEventListener('click', function () { showToast('报表已加入导出任务（原型演示）') }) })
    byId('closeDrawer').addEventListener('click', function () { byId('detailDrawer').classList.remove('open') })
    all('.dimension-chip').forEach(function (button) { button.addEventListener('click', function () { all('.dimension-chip').forEach(function (item) { item.classList.toggle('active', item === button) }); showToast('分析维度已切换为“' + button.textContent + '”') }) })
  }

  renderStaticWidgets()
  bindNavigation()
  bindChartSwitches()
  bindBuilder()
  bindGeneralActions()
  renderFieldList()
  renderBuilderPreview()
})()
