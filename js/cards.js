document.addEventListener('DOMContentLoaded', function () {

    const overlay = document.getElementById('card-overlay');
    const modal = document.getElementById('card-modal');
    const closeBtn = document.getElementById('modal-close');

    if (!overlay || !modal) return;

    // Populate modal fields
    function openModal(data) {
        document.getElementById('modal-tag-text').textContent = data.tag || '';
        document.getElementById('modal-img-el').src = data.img || '';
        document.getElementById('modal-img-el').alt = data.title || '';
        document.getElementById('modal-title-el').textContent = data.title || '';
        document.getElementById('modal-sub-el').textContent = data.sub || '';
        document.getElementById('modal-text-el').innerHTML = data.body || '';

        overlay.classList.add('active');
        // Small frame delay so CSS transition fires
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.classList.add('open');
            });
        });
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        setTimeout(() => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }, 350);
    }

    // Wire up every card
    document.querySelectorAll('.card-item').forEach(card => {
        card.addEventListener('click', () => {
            openModal({
                tag: card.dataset.tag,
                img: card.dataset.img,
                title: card.dataset.title,
                sub: card.dataset.sub,
                body: card.dataset.body,
            });
        });
    });

    // Close via button / overlay / Escape
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
});
