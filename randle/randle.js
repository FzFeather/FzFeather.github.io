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

	function getCell(i, div=null){
		if(div==null){
			return $('#answer-div div[data-pos="'+i+'"]');
		}else{
			return $('div[data-pos="'+i+'"]', div);
		}
	}
	var dictionary1 = null;
	var dictionary2 = null;

	// initialize dictionary
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

	function startGame(mode){
		game.status = 1;
		game.mode = mode;
		game.keyword = dictionary1[Math.floor(Math.random()*dictionary1.length)];
		$('#modeName').text(mode);
		if(mode=="lying"){
			$('.lying-hint').show()
		}
	}

	function getWord(div=null){
		let word = "";
		for(let i=1; i<=5; i++){
			let char = getCell(i, div).text();
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
		if(game.mode == 'lying' && word!=guess){
			let lying = Math.random()>0.5;
			if(lying){
				for(let i=0; i<5; i++){
					if(Math.random()>0.5){
						verdict[i] = (verdict[i]+1)%3;
					}else{
						verdict[i] = (verdict[i]+2)%3;
					}
				}
			}
		}
		return verdict;
	}

	function setKeyboard(guess, hint){
		guess = guess.toUpperCase();
		for(let i=0; i<5; i++){
			let key = $('.keyboard-key[data-key="'+guess[i]+'"]');
			// if(game.mode=="normal"){
			if(parseInt(hint[i]) == 0){
				if(!key.hasClass('answer-g') && !key.hasClass('answer-b') ){
					key.addClass('answer-b');
				}
			}else if(parseInt(hint[i]) == 1){
				key.removeClass('answer-b');
				key.removeClass('answer-y');
				key.addClass('answer-g');
			}else if(parseInt(hint[i]) == 2){
				if(!key.hasClass('answer-g')){
					key.removeClass('answer-b');
					key.addClass('answer-y');
				}
			}
			// }
		}
	}

	function submitWord(){
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
		let oldDiv = $("#answer-div")
		let newDiv = oldDiv.clone(true);

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

		oldDiv.attr('id', '');
		$('div[data-pos]', newDiv).empty();
		$('div[data-pos=1]', newDiv).addClass('active');
		$('#hint-div').append(newDiv);
		// $(".answer-box", newDiv).click(clickFocus);
		wordPos = 1;
		$("#hint-div").scrollTop($("#hint-div")[0].scrollHeight);
		if(game.mode == "normal"){
			setKeyboard(guessWord, verdict);
		}else if(game.mode == "lying"){
			$('.lying-hint', oldDiv).css('visibility', 'visible');
			$('.lying-hint', oldDiv).data('reply', verdict.join(''));
		}
	}

	// Events
	function inputChar(char){
		if (wordPos<=5) {
			$('#answer-div div[data-pos="'+wordPos+'"]').text(char.toUpperCase());

			if(wordPos<=4){
				wordPos++;

				$('#answer-div div[data-pos="'+(wordPos-1)+'"]').removeClass('active');
				$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
			}
		}
	}
	function backspace(){
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
	var wordPos = 1;

	$('.keyboard-key[data-key]').click(function(){
		inputChar($(this).data("key"));
	});
	$('#backspace-btn').click(backspace);
	$(document).on('keypress', function(e){
		if (event.keyCode >= 65 && event.keyCode <= 90) {
		    // Alphabet upper case
		} else if (event.keyCode >= 97 && event.keyCode <= 122) {
		    // Alphabet lower case
		} else {
			return;
		}
		if (e.which !== 0 && wordPos<=5) {
			inputChar(String.fromCharCode(e.which));
		}
	});

	$(document).on('keydown', function(e){
		if (e.keyCode==8){
			backspace();
		}else if(e.keyCode == 13){
			submitWord();
		}else if(e.keyCode == 32 || e.keyCode == 39){
			if(wordPos<5){
				wordPos++;
				$('#answer-div div[data-pos="'+(wordPos-1)+'"]').removeClass('active');
				$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
			}
		}else if(e.keyCode == 37){
			if(wordPos>=2){
				wordPos--;
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

	$('#submit-btn').click(submitWord);

	
	$('.lying-hint-btn').click(function(){
		$(this).siblings('.lying-hint-btn').removeClass('active');
		$(this).addClass('active');
		$(".keyboard-key").removeClass('answer-b')
						  .removeClass('answer-g')
						  .removeClass('answer-y');
		for(let lyingHint of $('.lying-hint')){
			let word = getWord($(lyingHint).closest('.guess-div'));
			let hint = $('.active', lyingHint).data('hint');
			let reply = $(lyingHint).data('reply');
			if(hint == "truth"){
				setKeyboard(word, reply);
			}else if(hint == "lie"){
				let fakeReply = [-1,-1,-1,-1,-1];
				for(let i=0; i<5; i++){
					if(reply[i]=="0"){
						fakeReply[i]=2;
					}
				}
				setKeyboard(word, fakeReply);
			}
		}
	});

})();
