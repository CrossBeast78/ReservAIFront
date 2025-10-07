import SessionStorageManager from '../AppStorage.js';
import { setupPasswordList } from './controllers/passwordListController.js';
import { setupModals } from './controllers/modalController.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = SessionStorageManager.getSession()?.access_token;
    if (!token) {
        alert("No hay sesión activa. Inicia sesión de nuevo.");
        window.location.href = "/";
        return;
    }

    const elements = {
        listEl: document.getElementById('password-list'),
        searchEl: document.getElementById('search'),
        prevBtn: document.getElementById('prev'),
        nextBtn: document.getElementById('next'),
        pageInfo: document.getElementById('page-info'),
        totalEl: document.getElementById('totalPasswords'),
    };

    const {reload } = await setupPasswordList(elements);

        setupModals({
        addBtn: document.getElementById('addPasswordBtn'),
        createModal: document.getElementById('createModal'),
        viewModal: document.getElementById('viewModal'),
        fields: {
            createName: document.getElementById('createName'),
            createPassword: document.getElementById('createPassword'),
            createDescription: document.getElementById('createDescription'),
            confirmPassword: document.getElementById('confirmPassword'),
            savePasswordBtn: document.getElementById('savePasswordBtn'),
        },
        listEl: elements.listEl,
        renderList: reload // Si necesitas recargar la lista después de editar/eliminar
    });
});
