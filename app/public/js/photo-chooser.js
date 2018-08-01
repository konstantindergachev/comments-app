`use strict`;

(() => {
    const photo = document.querySelector('input[type=file]');

    const label = photo.nextElementSibling;
    const labelValue = label.textContext;

    photo.addEventListener("change", function(ev) {
        let fileName = '';
        if (this.files && this.files.length > 1) {
            fileName = (this.getAttribute("data-multiple-caption") || "").replace(
                "{count}",
                this.files.length
            );
        } else {
            fileName = ev.target.value.split("\\").pop();
        }

        if (fileName) {
            label.querySelector("span").textContent = fileName;
        } else {
            label.textContent = labelValue;
        }
    });
})();

