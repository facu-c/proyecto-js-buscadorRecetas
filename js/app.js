function iniciarApp(){

    const resultado = document.querySelector('#resultado');

    const modal = new bootstrap.Modal('#modal',{});

    const selectCategorias = document.querySelector('#categorias');

    if(selectCategorias){
        selectCategorias.addEventListener('change', seleccionarCategorias);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');

    if(favoritosDiv){
        obtenerFavoritos();
    }

    function obtenerCategorias(){
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url).then( respuesta => {
           return respuesta.json();
        }).then( resultado => {
            mostrarCategorias(resultado.categories);
        })
    }

    function mostrarCategorias(categorias = []){
        categorias.forEach( categoria => {
            const option = document.createElement('OPTION');

            option.value = categoria.strCategory;
            option.textContent = categoria.strCategory; 
            console.log(option);

            selectCategorias.appendChild(option);
        })
    }

    function seleccionarCategorias(e){
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        fetch(url)
        .then(respuesta => respuesta.json())
        .then(resultado => mostrarRecetas(resultado.meals));
    }

    function mostrarRecetas(recetas = []){

        //limpiar html
        limpiarHTML(resultado);

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados';
        resultado.appendChild(heading);

        //iterar en los resultados
        recetas.forEach( receta => {
            const {idMeal, strMeal, strMealThumb} = receta;

            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card','mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;    

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget = '#modal';
            // recetaButton.dataset.bsToggle = 'modal';

            recetaButton.onclick = function() {
                seleccionarReceta(idMeal ?? receta.id);
            }

            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);

            resultado.appendChild(recetaContenedor);
        })

    }

    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
        .then(respuesta => respuesta.json())
        .then(resultado => mostrarRecetaModal(resultado.meals[0]));
    }

    function mostrarRecetaModal(recetas){
        //muestra el modal 
        const {idMeal, strInstructions, strIngredients ,strMeal, strMealThumb} = recetas;

        //añadir contenido al modal
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');
        
        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="Receta ${strMeal}" />
            <h3 class="my-3">Instruciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes</h3>
        `;


        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');
        //mostrar cantidades e ingredientes
        for(let i=1; i<=20; i++){
            if(recetas[`strIngredient${i}`]){
                const ingrediente = recetas[`strIngredient${i}`];
                const cantidad = recetas[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;
                
                listGroup.appendChild(ingredienteLi);
            }
        }

        modalBody.appendChild(listGroup);

        //seleccionamos el footer del modal
        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);

        //Crear botones de guardar favoritos y cerrar
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');  
        btnFavorito.textContent =  existeStorage(idMeal) ? 'Eliminar Favorito':'Guardar Favorito';

        //localStorage
        btnFavorito.onclick = function () {
            
            if(existeStorage(idMeal)){
                eliminarFavorito(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente');
                return 
            }
            
            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb,
            });
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Agregado Correctamente');
        }


        const bntCerrarModal = document.createElement('BUTTON');
        bntCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        bntCerrarModal.textContent = 'Cerrar';
        bntCerrarModal.onclick = function () {
            modal.hide();
        }

        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(bntCerrarModal);

        //muestra el modal
        modal.show();
    }


    function agregarFavorito(receta) {
        try {
            const storedFavoritos = localStorage.getItem('favoritos');
            const favoritos = storedFavoritos ? JSON.parse(storedFavoritos) : [];
            localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
        } catch (error) {
            console.error('Error parsing or retrieving favoritos:', error);
            // Handle the error as needed, e.g., set favoritos to an empty array
            localStorage.setItem('favoritos', JSON.stringify([receta]));
        }
    }

    function eliminarFavorito(id){
        try {
            const storedFavoritos = localStorage.getItem('favoritos');
            const favoritos = storedFavoritos ? JSON.parse(storedFavoritos) : [];
            const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
            localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
        } catch (error) {
            console.error('Error parsing or retrieving favoritos:', error);
            // Handle the error as needed, e.g., return false
            return false;
        }
    }

    function existeStorage(id) {
        try {
            const storedFavoritos = localStorage.getItem('favoritos');
            const favoritos = storedFavoritos ? JSON.parse(storedFavoritos) : [];
            return favoritos.some(favorito => favorito.id === id);
        } catch (error) {
            console.error('Error parsing or retrieving favoritos:', error);
            // Handle the error as needed, e.g., return false
            return false;
        }
    }

    function mostrarToast(mensaje){
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);

        toastBody.textContent = mensaje;
        
        toast.show();
    }
    
    function obtenerFavoritos(){
        const storedFavoritos = localStorage.getItem('favoritos');
        const favoritos = storedFavoritos ? JSON.parse(storedFavoritos) : [];
        if(favoritos.length){
            mostrarRecetas(favoritos);
            return;
        }
        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay favoritos aún';
        noFavoritos.classList.add('fs-4','text-center','font-bold')
        resultado.appendChild(noFavoritos);

    }

    function limpiarHTML(selector){
        while(selector.firstChild){
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);