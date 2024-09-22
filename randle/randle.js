(function(){

	// element
	const modeSelectModal = new bootstrap.Modal('#modeSelect', {});
	modeSelectModal.show();
	var invalidToast = new bootstrap.Toast($('#invalidToast'), {});

	var game = {
		status: 0,
		keyword: null,
		mode: null,
		guessWords: [],
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
		if(game.mode == "flipping"){
			let temp = word;
			word = guess;
			guess = temp;
		}
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

	function setKeyboard(guess, hint, option={}){
		if(game.mode=="lying"){
			if(!option['truth'] || option['truth']=="unknown") return;
			if(option['truth']=="lie"){

				let fakeReply = [-1,-1,-1,-1,-1];
				for(let i=0; i<5; i++){
					if(parseInt(hint[i])==0){
						fakeReply[i]=2;
					}
				}
				hint = fakeReply;
			}
		}else if(game.mode=="flipping"){
			let reply = [-1,-1,-1,-1,-1];
			for(let i=0; i<5; i++){
				if(parseInt(hint[i])==1){
					// green stays green
					reply[i]=1;
				}else{
					let presence = false;
					for(let j=0; j<5; j++){
						if(i==j) continue;
						if(parseInt(hint[j])==2){
							// Other place yellow
							presence = true;
							break;
						}
					}
					if(!presence){
						reply[i]=0;
					}
				}
			}
			hint = reply;
		}
		guess = guess.toUpperCase();
		for(let i=0; i<5; i++){
			let key = $('.keyboard-key[data-key="'+guess[i]+'"]');
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
		}
	}

	function submitWord(){
		let guessWord = getWord().toLowerCase();
		if(guessWord === null){
			return;
		}
		// Check word validity
		if(!dictionary2.includes(guessWord)){
			$('#alert-message').text('Not in word list.')
			invalidToast.show();
			return;
		}else{
			invalidToast.hide();
		}
		// Check for fixing
		if(game.mode == "fixing" && game.guessWords.length > 0){
			let lastGuess = game.guessWords[game.guessWords.length-1];
			let yellows = [];
			for(let i=0; i<5; i++){
				if(lastGuess.hint[i] == 2){
					yellows.push(lastGuess.word[i]);
				}
			}
			for(let i=0; i<5; i++){
				let pos = yellows.indexOf(guessWord[i])
				if(pos != -1){
					yellows.splice(pos, 1);
				}
			}
			if(yellows.length != 0){
				$('#alert-message').text('In FIXING mode, you need to have same letters as previous green in the exact same position before, and have same letters as previous yellow in random position.')
				invalidToast.show();
				return;
			}else{
				invalidToast.hide();
			}
		}

		// Accept Word

		let oldDiv = $("#answer-div");
		$(".answer-box", oldDiv).removeClass('active');
		let newDiv = oldDiv.clone(true);

		let verdict = check(game.keyword, guessWord);


		let allCorrect = (game.keyword==guessWord);

		for(let i=1; i<=5; i++){
			if(game.mode == "meteorite" && !allCorrect){
				if(Math.random()>0.75){
					getCell(i).addClass('meteorite');
					verdict[i-1] = -1;
					continue;
				}
			}
			if(verdict[i-1] == 0){
				getCell(i).addClass('answer-b');
			}else if(verdict[i-1] == 1){
				getCell(i).addClass('answer-g');
			}else if(verdict[i-1] == 2){
				getCell(i).addClass('answer-y');
			}
		}

		game.guessWords.push({"word":guessWord, "hint":verdict});

		oldDiv.attr('id', '');
		if(allCorrect) return;

		$('div[data-pos]', newDiv).empty();
		$('div[data-pos=1]', newDiv).addClass('active');
		$('#hint-div').append(newDiv);
		// $(".answer-box", newDiv).click(clickFocus);
		wordPos = 1;
		$("#hint-div").scrollTop($("#hint-div")[0].scrollHeight);
		setKeyboard(guessWord, verdict);
		if(game.mode == "lying"){
			$('.lying-hint', oldDiv).css('visibility', 'visible');
			$('.lying-hint', oldDiv).data('reply', verdict.join(''));
		}else if(game.mode == "not"){
			$('.keyboard-key').removeClass('not');
			for(let i=0; i<5; i++){
				$('.keyboard-key[data-key="'+guessWord[i].toUpperCase()+'"]').addClass('not');
			}
		}else if(game.mode == "fixing"){
			for(let i=0; i<5; i++){
				if(verdict[i]==1){
					getCell(i+1).addClass("fixing")
								.text(guessWord[i].toUpperCase())
								.addClass("answer-g");
				}
			}
		}
		if(getCell(1).hasClass('fixing')){
			gotoNextCell();
		}
	}

	// Events
	function gotoPrevCell(){
		let lastWordPos = wordPos;
		if(wordPos>=2){
			wordPos--;
			while(getCell(wordPos).hasClass("fixing")){
				wordPos--;
				if(wordPos<1){
					wordPos = lastWordPos;
					break;
				}
			}
			$('#answer-div div[data-pos="'+lastWordPos+'"]').removeClass('active');
			$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
		}
	}
	function gotoNextCell(){
		let lastWordPos = wordPos;
		if(wordPos<5){
			wordPos++;
			while(getCell(wordPos).hasClass("fixing")){
				wordPos++;
				if(wordPos>5){
					wordPos = lastWordPos;
					break;
				}
			}
			$('#answer-div div[data-pos="'+lastWordPos+'"]').removeClass('active');
			$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
		}
	}
	function inputChar(char){
		if($('.keyboard-key[data-key="'+char.toUpperCase()+'"]').hasClass('not')){
			$('.keyboard-key[data-key="'+char.toUpperCase()+'"]').addClass('shaking');
			setTimeout(() => {
			$('.keyboard-key[data-key="'+char.toUpperCase()+'"]').removeClass('shaking')}, 820);
			return;
		}
		if (wordPos<=5) {
			$('#answer-div div[data-pos="'+wordPos+'"]').text(char.toUpperCase());

			gotoNextCell();
		}
	}
	function backspace(){
		if($('#answer-div div[data-pos="'+wordPos+'"]').text() != ''){
			$('#answer-div div[data-pos="'+wordPos+'"]').text('');
			$('#answer-div div[data-pos="'+(wordPos+1)+'"]').removeClass('active');
			$('#answer-div div[data-pos="'+wordPos+'"]').addClass('active');
		}else if(wordPos>=2){
			gotoPrevCell();
			$('#answer-div div[data-pos="'+wordPos+'"]').text('');
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
			gotoNextCell();
		}else if(e.keyCode == 37){
			gotoPrevCell();
		}
	});

	function clickFocus(){
		if($(this).closest("#answer-div").length==0) return;
		if($(this).hasClass("fixing")) return;
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
			if(word==null || reply===undefined) continue;
			setKeyboard(word, reply, {"truth":hint});
		}
	});

})();
