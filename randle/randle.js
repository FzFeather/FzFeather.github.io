(function(){

	// element
	const modeSelectModal = new bootstrap.Modal('#modeSelect', {});
	modeSelectModal.show();
	var invalidToast = new bootstrap.Toast($('#invalidToast'), {});

	var game = {
		status: 0,
		keyword: null,
		mode: null,
	};

	function getCell(i){
		return $('#answer-div div[data-pos="'+i+'"]');
	}
	var dictionary1 = null;
	var dictionary2 = null;

	function startGame(mode){
		game.status = 1;
		game.mode = mode;
		game.keyword = dictionary1[Math.floor(Math.random()*dictionary1.length)];
	}

	function getWord(){
		let word = "";
		for(let i=1; i<=5; i++){
			let char = getCell(i).text();
			if(char.length == 0){
				return null;
			}
			word += char;
		}
		return word;
	}

	function check(word, guess){
		let cw = [0, 0, 0, 0, 0];
		let cg = [0, 0, 0, 0, 0];
		verdict = [0, 0, 0, 0, 0];
		for(let i=0; i<5; i++){
			if(word.charAt(i) == guess.charAt(i)){
				cw[i] = 1;
				cg[i] = 1;
				verdict[i] = 1;
			}
		}
		for(let i=0; i<5; i++){
			for(let j=0; j<5; j++){
				if(cw[i] != 0 || cg[j] != 0){
					continue
				}
				if(word.charAt(i) == guess.charAt(j)){
					cw[i] = 1;
					cg[j] = 1;
					verdict[j] = 2;
				}
			}
		}
		return verdict;
	}

	var wordPos = 1;
	$(document).on('keypress', function(e){
		if (event.keyCode >= 65 && event.keyCode <= 90) {
		    // Alphabet upper case
		} else if (event.keyCode >= 97 && event.keyCode <= 122) {
		    // Alphabet lower case
		} else {
			return;
		}
		if (e.which !== 0 && wordPos<=5) {
			$('#answer-div div[data-pos="'+wordPos+'"]').text(String.fromCharCode(e.which).toUpperCase());

			if(wordPos<=4){
				wordPos++;

				$('#answer-div div[data-pos="'+(wordPos-1)+'"]').removeClass('active');
				$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
			}
		}
	})

	$(document).on('keydown', function(e){
		if (e.keyCode==8){
			if($('#answer-div div[data-pos="'+wordPos+'"]').text() != ''){
				$('#answer-div div[data-pos="'+wordPos+'"]').text('');
				$('#answer-div div[data-pos="'+(wordPos+1)+'"]').removeClass('active');
				$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
			}else if(wordPos>=2){
				wordPos--;
				$('#answer-div div[data-pos="'+wordPos+'"]').text('');
				$('#answer-div div[data-pos="'+(wordPos+1)+'"]').removeClass('active');
				$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
			}
		}
	});

	function clickFocus(){
		if($(this).closest("#answer-div").length==0) return;
		$(".answer-box").removeClass('active');
		$(this).addClass('active');
		wordPos = parseInt($(this).data('pos'));
	}

	$("#answer-div .answer-box").click(clickFocus);

	$('#submit-btn').click(function(){
		let guessWord = getWord().toLowerCase();
		if(guessWord === null){
			return;
		}
		// Check word validity
		if(!dictionary2.includes(guessWord)){
			invalidToast.show();
			return;
		}else{
			invalidToast.hide();
		}

		$("#answer-div .answer-box").removeClass('active')
		let newDiv = $("#answer-div").clone();

		let verdict = check(game.keyword, guessWord);
		let allCorrect = true;
		for(let i=1; i<=5; i++){
			if(verdict[i-1] == 0){
				getCell(i).addClass('answer-b');
				allCorrect = false;
			}else if(verdict[i-1] == 1){
				getCell(i).addClass('answer-g');
			}else{
				getCell(i).addClass('answer-y');
				allCorrect = false;
			}
		}
		if(allCorrect) return;

		$("#answer-div").attr('id', '');
		$('div[data-pos]', newDiv).empty();
		$('div[data-pos=1]', newDiv).addClass('active');
		$('#hint-div').append(newDiv);
		$(".answer-box", newDiv).click(clickFocus);
		wordPos = 1;
		$("#hint-div").scrollTop($("#hint-div")[0].scrollHeight);
	});

	$.ajax({
		url: './word1',
		success: function(data){
			dictionary1 = data.split(' ');
		}
	})
	$.ajax({
		url: './word2',
		success: function(data){
			dictionary2 = data.split(' ');
		}
	})


	$('.mode-select-btn').click(function(){
		modeSelectModal.hide();
		startGame($(this).data('mode'));
	})

})();
