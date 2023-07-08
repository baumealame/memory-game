const answer = document.getElementById("copyButton");
const copy   = document.getElementById("copyButton");
const selection = window.getSelection();
const range = document.createRange();
const textToCopy = document.getElementById("textToCopy")

copy.addEventListener('click', function(e) {
    range.selectNodeContents(textToCopy);
    selection.removeAllRanges();
    selection.addRange(range);
    const successful = document.execCommand('copy');
    if(successful){
      answer.innerHTML = '주소를 복사했습니다!';
      copy.classList.add('copy_done');
    } else {
      answer.innerHTML = '문제가 발생했습니다. 다시 시도해주세요.';  
    }
    window.getSelection().removeAllRanges()
});