
document.addEventListener("DOMContentLoaded", function () {
    const wrapper = document.getElementById("modal-wrapper");
    const rotation = document.getElementById("rotation");
    const button = document.getElementById("fullscreen-button");

    if (!wrapper || !rotation || !button) return;

    const images = Array.from(rotation.querySelectorAll("img"));

    if (images.length === 0) return;

    let currentFrame = 0;
    let startX = 0;
    let lastX = 0;
    let accumulatedMovement = 0;
    let dragging = false;
    let activePointerId = null;

    // Ajuste este valor para controlar a sensibilidade do giro.
    const pixelsPerFrame = 12;

    function showFrame(index) {
        currentFrame = (index + images.length) % images.length;

        images.forEach(function (img, i) {
            img.classList.toggle("active", i === currentFrame);
        });
    }

    function changeFrame(delta) {
        showFrame(currentFrame + delta);
    }

    function startDrag(event) {
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        // Não iniciar o giro ao tocar no botão de tela cheia.
        if (event.target.closest("#fullscreen-button")) return;

        dragging = true;
        activePointerId = event.pointerId;
        startX = event.clientX;
        lastX = event.clientX;
        accumulatedMovement = 0;

        rotation.style.cursor = "grabbing";

        if (rotation.setPointerCapture) {
            try {
                rotation.setPointerCapture(event.pointerId);
            } catch (error) {
                // Alguns navegadores podem não permitir a captura.
            }
        }
    }

    function moveDrag(event) {
        if (!dragging || event.pointerId !== activePointerId) return;

        const deltaX = event.clientX - lastX;
        lastX = event.clientX;
        accumulatedMovement += deltaX;

        const framesToMove = Math.trunc(
            accumulatedMovement / pixelsPerFrame
        );

        if (framesToMove !== 0) {
            changeFrame(-framesToMove);
            accumulatedMovement -= framesToMove * pixelsPerFrame;
        }
    }

    function endDrag(event) {
        if (!dragging) return;

        if (
            event &&
            activePointerId !== null &&
            event.pointerId !== undefined &&
            event.pointerId !== activePointerId
        ) {
            return;
        }

        dragging = false;
        activePointerId = null;
        rotation.style.cursor = "";
    }

    rotation.addEventListener("pointerdown", startDrag);
    rotation.addEventListener("pointermove", moveDrag);
    rotation.addEventListener("pointerup", endDrag);
    rotation.addEventListener("pointercancel", endDrag);
    rotation.addEventListener("lostpointercapture", endDrag);

    // Atualiza o botão conforme o estado da tela cheia.
    function isFullscreen() {
        return wrapper.classList.contains("ios-fullscreen") ||
            document.fullscreenElement === wrapper ||
            document.webkitFullscreenElement === wrapper;
    }

    function updateButton() {
        const active = isFullscreen();

        button.textContent = active ? "×" : "⛶";

        button.setAttribute(
            "aria-label",
            active ? "Sair da tela cheia" : "Ativar tela cheia"
        );

        button.setAttribute("aria-pressed", String(active));
    }

    async function enterFullscreen() {
        // Tenta usar a tela cheia nativa, quando suportada.
        try {
            if (wrapper.requestFullscreen) {
                await wrapper.requestFullscreen();
                updateButton();
                return;
            }

            if (wrapper.webkitRequestFullscreen) {
                await wrapper.webkitRequestFullscreen();
                updateButton();
                return;
            }
        } catch (error) {
            // Usa o modo alternativo se a API falhar.
        }

        // Alternativa para navegadores iOS sem Fullscreen API
        // compatível com elementos HTML comuns.
        wrapper.classList.add("ios-fullscreen");
        document.body.classList.add("ios-fullscreen-active");

        updateButton();
    }

    async function exitFullscreen() {
        const nativeFullscreen =
            document.fullscreenElement === wrapper ||
            document.webkitFullscreenElement === wrapper;

        if (nativeFullscreen) {
            try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            } catch (error) {
                // Limpa também o modo alternativo abaixo.
            }
        }

        wrapper.classList.remove("ios-fullscreen");
        document.body.classList.remove("ios-fullscreen-active");

        updateButton();
    }

    button.addEventListener("click", async function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (isFullscreen()) {
            await exitFullscreen();
        } else {
            await enterFullscreen();
        }
    });

    document.addEventListener("fullscreenchange", updateButton);
    document.addEventListener("webkitfullscreenchange", updateButton);

    showFrame(0);
    updateButton();
});
