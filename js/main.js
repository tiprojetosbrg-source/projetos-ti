// js/main.js
const app = new window.AppController();
window.app = app;

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    app.fecharModalEdicaoEtapaIndividual();
    app.fecharModalForm();
    app.fecharModalDetalhesId();
    app.fecharModalPreviewExcel();
    app.fecharModalExclusao();
    app.fecharModalConfiguracoes();
    app.fecharHorizonteDropdown();
    app.fecharPrioridadeRoadmapDropdown();
    app.fecharPopupMesAno();
    app.fecharModalRelatorioAtrasos();
    app.fecharStatusReportDropdown();
    app.fecharStatusEtapaReportDropdown();
    app.fecharPrioridadeReportDropdown();
    app.fecharModalVisaoExecutiva();
  }
});

window.addEventListener('click', (e) => {
  // Horizonte dropdown
  const dropdownHorizonte = document.getElementById('dropdownHorizonteAnos');
  const btnToggleHorizonte = document.getElementById('btnToggleHorizonteDropdown');
  if (dropdownHorizonte && !dropdownHorizonte.classList.contains('hidden')) {
    if (!dropdownHorizonte.contains(e.target) && (!btnToggleHorizonte || !btnToggleHorizonte.contains(e.target))) {
      dropdownHorizonte.classList.add('hidden');
    }
  }

  // Prioridade Roadmap dropdown
  const dropdownPrioridadeRoadmap = document.getElementById('dropdownPrioridadeRoadmap');
  const btnTogglePrioridadeRoadmap = document.getElementById('btnTogglePrioridadeRoadmapDropdown');
  if (dropdownPrioridadeRoadmap && !dropdownPrioridadeRoadmap.classList.contains('hidden')) {
    if (!dropdownPrioridadeRoadmap.contains(e.target) && (!btnTogglePrioridadeRoadmap || !btnTogglePrioridadeRoadmap.contains(e.target))) {
      dropdownPrioridadeRoadmap.classList.add('hidden');
    }
  }

  // Prioridade Report multiselect dropdown
  const dropdownPrioridadeReport = document.getElementById('dropdownPrioridadeReport');
  const btnTogglePrioridadeReport = document.getElementById('btnTogglePrioridadeReportDropdown');
  if (dropdownPrioridadeReport && !dropdownPrioridadeReport.classList.contains('hidden')) {
    if (!dropdownPrioridadeReport.contains(e.target) && (!btnTogglePrioridadeReport || !btnTogglePrioridadeReport.contains(e.target))) {
      dropdownPrioridadeReport.classList.add('hidden');
    }
  }

  // Status Report dropdown
  const dropdownStatusReport = document.getElementById('dropdownStatusReport');
  const btnToggleStatusReport = document.getElementById('btnToggleStatusReportDropdown');
  if (dropdownStatusReport && !dropdownStatusReport.classList.contains('hidden')) {
    if (!dropdownStatusReport.contains(e.target) && (!btnToggleStatusReport || !btnToggleStatusReport.contains(e.target))) {
      dropdownStatusReport.classList.add('hidden');
    }
  }

  // Status da Etapa Report multiselect dropdown
  const dropdownStatusEtapaReport = document.getElementById('dropdownStatusEtapaReport');
  const btnToggleStatusEtapaReport = document.getElementById('btnToggleStatusEtapaReportDropdown');
  if (dropdownStatusEtapaReport && !dropdownStatusEtapaReport.classList.contains('hidden')) {
    if (!dropdownStatusEtapaReport.contains(e.target) && (!btnToggleStatusEtapaReport || !btnToggleStatusEtapaReport.contains(e.target))) {
      dropdownStatusEtapaReport.classList.add('hidden');
    }
  }

  // Popup seletor de mês/ano
  const popupPicker = document.getElementById('popupSeletorMesAno');
  if (popupPicker && !popupPicker.classList.contains('hidden')) {
    if (
      !popupPicker.contains(e.target) &&
      !e.target.closest('#inputPrazoInicio') &&
      !e.target.closest('#inputPrazo') &&
      !e.target.closest('#inputConclusao')
    ) {
      app.fecharPopupMesAno();
    }
  }
});