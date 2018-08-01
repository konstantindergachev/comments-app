`use strict`;

(() => {
    function Validator(elements) {
        this.elements = elements;
        this.getValidation = function(nameAttribute) {
            const VALIDFIELDS = {
                TEXT: 0,
                NAME: 1,
                PHOTO: 2
            };
            this.elements.forEach((el, i) => {
                switch (i) {
                    case VALIDFIELDS.TEXT:
                        el.setAttribute(nameAttribute, 'Enter your message');
                        break;
                    case VALIDFIELDS.NAME:
                        el.setAttribute(nameAttribute, 'Enter your name');
                        break;
                    case VALIDFIELDS.PHOTO:
                        el.nextElementSibling.children[0].textContent =
                            'Choise your file';
                        break;
                }
            });
            return this;
        };
    }

    function Factory(selector) {
        let elements = null;
        selector instanceof HTMLElement
            ? (elements = [selector])
            : (elements = document.querySelectorAll(selector));
        return new Validator(elements);
    }

    window.addEventListener('click', () => {
        const formControl = Factory('.post__form-control');
        const form = document.forms.postForm;

        form.addEventListener('submit', ev => {
            formControl.elements.forEach((el, i) => {
                if (el.value === '') {
                    ev.preventDefault();
                    el.classList.add('error');
                    formControl.getValidation('placeholder');
                }
                if (el.hasAttribute('accept')) {
                    el.nextElementSibling.classList.add('error');
                    const ArrayOfBtnTextFileName = el.nextElementSibling.children[0].textContent.split(
                        '.'
                    );
                    if (
                        ArrayOfBtnTextFileName[1] === 'jpg' ||
                        ArrayOfBtnTextFileName[1] === 'png'
                    ) {
                        el.nextElementSibling.classList.remove('error');
                    }
                }
            });
        });
        form.addEventListener('click', ev => {
            const target = ev.target;
            const msg = ['Text', 'Name'];

            switch (target.getAttribute('Name')) {
                case 'text':
                    target.setAttribute('placeholder', msg[0]);
                    break;
                case 'name':
                    target.setAttribute('placeholder', msg[1]);
                    break;
            }
            target.classList.remove('error');
        });
    });
})();

(() => {
    const editBtn = document.querySelectorAll('.comments__edit-btn');
    request = new Request('post/comment/edit');
    editBtn.forEach(item => {
        item.addEventListener('submit', ev => {
            const target = ev.target.previousElementSibling.textContent;
            console.log(`target: `, target);
            const notes = { target };
            fetch(request, {
                methd: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notes)
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return Promise.reject(
                            'На сервере идут работы. В ближайшее время ресурс возобновит свою работу. Приносим свои извинения.'
                        );
                    }
                })
                .then(data => console.log(`data: `, data))
                .catch(err => console.log(`Error: `, err));
            console.log(`target: `, target);
            ev.preventDefault();
        });
    });
})();
