document.getElementsByClassName("nav-link megamenulink")[0].addEventListener("mouseenter", openMegaMenu);
document.getElementsByClassName("nav-link megamenulink")[0].addEventListener("mouseleave", closeMegaMenu);

document.getElementsByClassName("nav-link megamenulink")[1].addEventListener("mouseenter", openMegaMenu);
document.getElementsByClassName("nav-link megamenulink")[1].addEventListener("mouseleave", closeMegaMenu);

document.getElementsByClassName("nav-link megamenulink")[2].addEventListener("mouseenter", openMegaMenu);
document.getElementsByClassName("nav-link megamenulink")[2].addEventListener("mouseleave", closeMegaMenu);

function openMegaMenu() {
	document.getElementById("megamenu-main").style.display = "block";
	document.getElementById("megamenu-main").style.transition = "all 0.3s ease";
}

function closeMegaMenu() {
	document.getElementById("megamenu-main").style.display = "none";
}

document.getElementById("megamenu-main").addEventListener("mouseenter", openMegaMenu2);
document.getElementById("megamenu-main").addEventListener("mouseleave", closeMegaMenu2);

function openMegaMenu2() {
	document.getElementById("megamenu-main").style.display = "block";
}

function closeMegaMenu2() {
	document.getElementById("megamenu-main").style.display = "none";
}

