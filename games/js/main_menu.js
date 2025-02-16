const quit_popup = document.getElementById('quit_popup');
const quit_btn = document.getElementById('quit_btn');
const no_btn_quit = document.getElementById('no_btn_quit');
const yes_btn_quit = document.getElementById('yes_btn_quit');
const opt_btn = document.getElementById('opt_btn');
const play_btn = document.getElementById('play_btn');


quit_btn.addEventListener('click', (e) => {
    quit_popup.style.display = "block";
    opt_btn.style.display = "none";
    quit_btn.style.display = "none";
    play_btn.style.display = "none";
});

no_btn_quit.addEventListener('click', (e) => {
    quit_popup.style.display = "none";
    opt_btn.style.display = "block";
    quit_btn.style.display = "block";
    play_btn.style.display = "block";
});

yes_btn_quit.addEventListener('click', (e) => {
    window.close()
});

play_btn.addEventListener('click', (e) => {
    alert("Nope")
});

opt_btn.addEventListener('click', (e) => {
    document.location.href = '../options_menu.html'
});