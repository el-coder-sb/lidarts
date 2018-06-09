$(document).ready(function() {
    // namespace for the game handling
    namespace = '/game';
    // Connect to the Socket.IO server.
    // The connection URL has the following format:
    //     http[s]://<domain>:<port>[/<namespace>]
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
    // Event handler for new connections.
    // The callback function is invoked when a connection with the
    // server is established.

    socket.emit('player_heartbeat');

    window.setInterval(function(){
        /// call your function here
        socket.emit('player_heartbeat');
    }, 5000);

    var p1_next_turn;
    var p1_id;
    var p2_id;

    var hashid = $('#hash_id').data();
    socket.on('connect', function() {
        socket.emit('init', {hashid: hashid['hashid'] });
    });

    socket.on('game_aborted', function(msg) {
        $('.score_input').hide();
        $('.game-aborted').show();
    });

    socket.on('closest_to_bull_score', function(msg) {
        $('#closest_to_bull_notification').text('Throw three darts at bull.');
        $('#p1_score').html('');
        $('#p2_score').html('');
        if (msg.p1_score.length == 0){  $('#p1_score').html('-'); }
        if (msg.p2_score.length == 0){  $('#p2_score').html('-'); }
        $.each(msg.p1_score, function( index, value ){
            $('#p1_score').append(' ' + value);
        });
        $.each(msg.p2_score, function( index, value ){
            $('#p2_score').append(' ' + value);
        });
    });

    socket.on('closest_to_bull_draw', function(msg) {
        $('#p1_score').html('');
        $('#p2_score').html('');
        $.each(msg.p1_score, function( index, value ){
            $('#p1_score').append(' ' + value);
        });
        $.each(msg.p2_score, function( index, value ){
            $('#p2_score').append(' ' + value);
        });
        $('#closest_to_bull_notification').text('Draw. Throw again.');
    });

    socket.on('closest_to_bull_completed', function(msg) {
        $('#p1_score').html('');
        $('#p2_score').html('');
        $.each(msg.p1_score, function( index, value ){
            $('#p1_score').append(' ' + value);
        });
        $.each(msg.p2_score, function( index, value ){
            $('#p2_score').append(' ' + value);
        });
        if (msg.p1_won) {
            $('#closest_to_bull_notification').text('Player 1 to throw first. Game on!');
        } else {
            $('#closest_to_bull_notification').text('Player 2 to throw first. Game on!');
        }
        setTimeout(function() {
            $('#closest_to_bull_notification_div').hide();
            socket.emit('init', {hashid: hashid['hashid'] });
        }, 3000);

    });


    socket.on('game_shot', function(msg) {
        $('#p1_current_leg').text('');

        // display old scores for a short time
        var p1_last_leg_sum = 0;
        if (msg.p1_last_leg.length > 0) {
            p1_last_leg_sum = msg.p1_last_leg.reduce(function(acc, val) {return acc + val})
        }
        // display all single scores for player 1
        $.each(msg.p1_last_leg, function( index, value ){
            // fade in latest score
            if ( index == msg.p1_last_leg.length-1 && p1_last_leg_sum == msg.type) {
                $('#p1_current_leg').prepend(
                    '<div id="new_score_fadein">' +
                    '<div class="row text-light d-flex align-items-center"><div class="col-2"></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2 text-right text-secondary"><h3>' + (index+1) + "</h3></div></div></div>"
                );
                $('#new_score_fadein').hide().fadeIn(2000);
            } else {
                $('#p1_current_leg').prepend(
                    '<div class="row text-light d-flex align-items-center"><div class="col-2"></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2 text-right text-secondary"><h3>' + (index+1) + "</h3></div></div>"
                )
            };
        });
        // display all single scores for player 2
        $('#p2_current_leg').text('');
        $.each(msg.p2_last_leg, function( index, value ){
            // fade in latest score
            if ( index == msg.p2_last_leg.length-1 && p1_last_leg_sum != msg.type) {
                $('#p2_current_leg').prepend(
                    '<div id="new_score_fadein">' +
                    '<div class="row text-light d-flex align-items-center"><div class="col-2 text-left text-secondary"><h3>' + (index + 1) + '</h3></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2"></div></div></div>'
                );
                $('#new_score_fadein').hide().fadeIn(2000);
            } else {
                $('#p2_current_leg').prepend(
                    '<div class="row text-light d-flex align-items-center"><div class="col-2 text-left text-secondary"><h3>' + (index + 1) + '</h3></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2"></div></div></div>'
                )
            }
        });

        // show current leg and set scores
        $('.p1_sets').text(msg.p1_sets);
        $('.p2_sets').text(msg.p2_sets);
        $('.p1_legs').text(msg.p1_legs);
        $('.p2_legs').text(msg.p2_legs);

        // popup for game shot
        $('#game-shot-modal').modal('show');
        if (msg.p1_won) {
            var last_score = msg.type;
            for (var i = 0; i < msg.p1_last_leg.length-1; i++) {
                last_score -= msg.p1_last_leg[i] << 0;
            }
            // score substraction animation
            jQuery({Counter: last_score}).animate({Counter: -1}, {
                duration: 1000,
                easing: 'swing',
                step: function () {
                    $('.p1_score').text(Math.ceil(this.Counter));
                }
            }).promise().done(function() {
                setTimeout(function() {
                    $('#game-shot-modal').modal('hide');
                }, 1500);
                // move on after 3 seconds
                setTimeout(function() {
                    socket.emit('get_score_after_leg_win', {hashid: hashid['hashid'] });
                }, 3000);
            });
        } else {
            $('.p1_score').html(msg.p1_score);
        }
        if (!msg.p1_won) {
            var last_score = msg.type;
            for (var i = 0; i < msg.p2_last_leg.length-1; i++) {
                last_score -= msg.p2_last_leg[i] << 0;
            }
            // score substraction animation
            jQuery({Counter: last_score}).animate({Counter: -1}, {
                duration: 1500,
                easing: 'swing',
                step: function () {
                    $('.p2_score').text(Math.ceil(this.Counter));
                }
            }).promise().done(function() {
                setTimeout(function() {
                    $('#game-shot-modal').modal('hide');
                }, 1500);
                // move on after 3 seconds
                setTimeout(function() {
                    socket.emit('get_score_after_leg_win', {hashid: hashid['hashid'] });
                }, 3000);
            });
        } else {
            $('.p2_score').text(msg.p2_score);
        }

    });

    // Event handler for server sent score data
    socket.on('score_response', function(msg) {
        p1_next_turn = msg.p1_next_turn;
        p1_id = msg.p1_id;
        p2_id = msg.p2_id;

        if ( !msg.p1_next_turn && msg.old_score > msg.p1_score) {
            // score substraction animation
            jQuery({Counter: msg.old_score}).animate({Counter: msg.p1_score-1}, {
                duration: 1000,
                easing: 'swing',
                step: function () {
                    $('.p1_score').text(Math.ceil(this.Counter));
                }
            });
        } else {
            $('.p1_score').html(msg.p1_score);
        }
        if ( msg.p1_next_turn && msg.old_score > msg.p2_score) {
            // score substraction animation
            jQuery({Counter: msg.old_score}).animate({Counter: msg.p2_score-1}, {
                duration: 1000,
                easing: 'swing',
                step: function () {
                    $('.p2_score').text(Math.ceil(this.Counter));
                }
            });
        } else {
            $('.p2_score').text(msg.p2_score);
        }

        // show current leg and set scores
        $('.p1_sets').text(msg.p1_sets);
        $('.p2_sets').text(msg.p2_sets);
        $('.p1_legs').text(msg.p1_legs);
        $('.p2_legs').text(msg.p2_legs);

        // statistics
        $('.p1_leg_avg').text(msg.p1_leg_avg);
        $('.p2_leg_avg').text(msg.p2_leg_avg);
        $('.p1_match_avg').text(msg.p1_match_avg);
        $('.p2_match_avg').text(msg.p2_match_avg);
        $('.p1_first9_avg').text(msg.p1_first9_avg);
        $('.p2_first9_avg').text(msg.p2_first9_avg);
        $('.p1_100').text(msg.p1_100);
        $('.p2_100').text(msg.p2_100);
        $('.p1_140').text(msg.p1_140);
        $('.p2_140').text(msg.p2_140);
        $('.p1_180').text(msg.p1_180);
        $('.p2_180').text(msg.p2_180);
        $('.p1_high_finish').text(msg.p1_high_finish);
        $('.p2_high_finish').text(msg.p2_high_finish);
        $('.p1_short_leg').text(msg.p1_short_leg);
        $('.p2_short_leg').text(msg.p2_short_leg);
        $('.p1_doubles').text((Math.round(msg.p1_doubles * 100) / 100) + '% ('+ msg.p1_legs_won + '/' + msg.p1_darts_thrown_double + ')');
        $('.p2_doubles').text((Math.round(msg.p2_doubles * 100) / 100) + '% ('+ msg.p2_legs_won + '/' + msg.p2_darts_thrown_double + ')');

        $('.p1_darts_this_leg').text((msg.p1_current_leg.length)*3);
        $('.p2_darts_this_leg').text((msg.p2_current_leg.length)*3);

        $('#p1_current_leg').text('');
        $.each(msg.p1_current_leg, function( index, value ){
            if ( index == msg.p1_current_leg.length-1 && !msg.p1_next_turn) {
                $('#p1_current_leg').prepend(
                    '<div id="new_score_fadein">' +
                    '<div class="row text-light d-flex align-items-center"><div class="col-2"></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2 text-right text-secondary"><h3>' + (index+1) + "</h3></div></div></div>"
                );
                $('#new_score_fadein').hide().fadeIn(2000);
            } else {
                $('#p1_current_leg').prepend(
                    '<div class="row text-light d-flex align-items-center"><div class="col-2"></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2 text-right text-secondary"><h3>' + (index+1) + "</h3></div></div>"
                )
            };
        });
        $('#p2_current_leg').text('');
        $.each(msg.p2_current_leg, function( index, value ){
            if ( index == msg.p2_current_leg.length-1 && msg.p1_next_turn) {
                $('#p2_current_leg').prepend(
                    '<div id="new_score_fadein">' +
                    '<div class="row text-light d-flex align-items-center"><div class="col-2 text-left text-secondary"><h3>' + (index + 1) + '</h3></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2"></div></div></div>'
                );
                $('#new_score_fadein').hide().fadeIn(2000);
            } else {
                $('#p2_current_leg').prepend(
                    '<div class="row text-light d-flex align-items-center"><div class="col-2 text-left text-secondary"><h3>' + (index + 1) + '</h3></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2"></div></div></div>'
                )
            }
        });

        // Colored turn indicators.
        if (msg.p1_next_turn) {
            $('.p1_turn_outer_card').removeClass('border-0');
            $('.p1_turn_outer_card').addClass('border-1 border-light');
            $('.p1_turn_name_card').removeClass('bg-dark border-0');
            $('.p1_turn_name_card').addClass('bg-secondary');
            $('.p1_turn_score_card').removeClass('bg-secondary');
            $('.p1_turn_score_card').addClass('bg-danger');
            $('.p2_turn_outer_card').removeClass('border-1 border-light');
            $('.p2_turn_outer_card').addClass('border-0');
            $('.p2_turn_name_card').removeClass('bg-secondary');
            $('.p2_turn_name_card').addClass('bg-dark border-0');
            $('.p2_turn_score_card').removeClass('bg-danger');
            $('.p2_turn_score_card').addClass('bg-secondary');

            $('.p1_turn_incidator').html('<i class="fas fa-angle-left"></i>');
            $('.p2_turn_incidator').html('');
        } else {
            $('.p1_turn_outer_card').removeClass('border-1 border-light');
            $('.p1_turn_outer_card').addClass('border-0');
            $('.p1_turn_name_card').removeClass('bg-secondary');
            $('.p1_turn_name_card').addClass('bg-dark border-0');
            $('.p1_turn_score_card').removeClass('bg-danger');
            $('.p1_turn_score_card').addClass('bg-secondary');
            $('.p2_turn_outer_card').removeClass('border-0');
            $('.p2_turn_outer_card').addClass('border-1 border-light');
            $('.p2_turn_name_card').removeClass('bg-dark border-0');
            $('.p2_turn_name_card').addClass('bg-secondary');
            $('.p2_turn_score_card').removeClass('bg-secondary');
            $('.p2_turn_score_card').addClass('bg-danger');

            $('.p1_turn_incidator').html('');
            $('.p2_turn_incidator').html('<i class="fas fa-angle-left"></i>');
        }

        if (msg.computer_game && !msg.p1_next_turn) {
            setTimeout(function() {
                socket.emit('send_score', {hashid: hashid['hashid'],
                    user_id: user_id['id'], computer: true});
            }, 3000);

        }
    });
    // Remove turn indicators when game is over and show link to game overview
    socket.on('game_completed', function(msg) {
        $('#p1_current_leg').text('');
        var p1_last_leg_sum = 0;
        if (msg.p1_last_leg.length > 0) {
            p1_last_leg_sum = msg.p1_last_leg.reduce(function(acc, val) {return acc + val})
        }
        $.each(msg.p1_last_leg, function( index, value ){
            if ( index == msg.p1_last_leg.length-1 && p1_last_leg_sum == msg.type) {
                $('#p1_current_leg').prepend(
                    '<div id="new_score_fadein">' +
                    '<div class="row text-light d-flex align-items-center"><div class="col-2"></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2 text-right text-secondary"><h3>' + (index+1) + "</h3></div></div></div>"
                );
                $('#new_score_fadein').hide().fadeIn(2000);
            } else {
                $('#p1_current_leg').prepend(
                    '<div class="row text-light d-flex align-items-center"><div class="col-2"></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2 text-right text-secondary"><h3>' + (index+1) + "</h3></div></div>"
                )
            };
        });
        $('#p2_current_leg').text('');
        $.each(msg.p2_last_leg, function( index, value ){
            if ( index == msg.p2_last_leg.length-1 && p1_last_leg_sum != msg.type) {
                $('#p2_current_leg').prepend(
                    '<div id="new_score_fadein">' +
                    '<div class="row text-light d-flex align-items-center"><div class="col-2 text-left text-secondary"><h3>' + (index + 1) + '</h3></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2"></div></div></div>'
                );
                $('#new_score_fadein').hide().fadeIn(2000);
            } else {
                $('#p2_current_leg').prepend(
                    '<div class="row text-light d-flex align-items-center"><div class="col-2 text-left text-secondary"><h3>' + (index + 1) + '</h3></div>' +
                    '<div class="col-8 text-center"><h2 style="font-weight: bold">' + value + '</h2></div>' +
                    '<div class="col-2"></div></div></div>'
                )
            }
        });

        $('.p1_sets').text(msg.p1_sets);
        $('.p2_sets').text(msg.p2_sets);
        $('.p1_legs').text(msg.p1_legs);
        $('.p2_legs').text(msg.p2_legs);

        $('#match-shot-modal').modal('show');
        if (msg.p1_won) {
            jQuery({Counter: msg.p1_last_leg[msg.p1_last_leg.length-1]}).animate({Counter: -1}, {
                duration: 1000,
                easing: 'swing',
                step: function () {
                    $('.p1_score').text(Math.ceil(this.Counter));
                }
            }).promise().done(function() {
                setTimeout(function() {
                    $('#match-shot-modal').modal('hide');
                }, 1500);
            });
        } else {
            $('.p1_score').html(msg.p1_score);
        }
        if (!msg.p1_won) {
            jQuery({Counter: msg.p2_last_leg[msg.p2_last_leg.length-1]}).animate({Counter: -1}, {
                duration: 1000,
                easing: 'swing',
                step: function () {
                    $('.p2_score').text(Math.ceil(this.Counter));
                }
            }).promise().done(function() {
                setTimeout(function() {
                    $('#match-shot-modal').modal('hide');
                }, 1500);
            });
        } else {
            $('.p2_score').html(msg.p2_score);
        }
        $('.score_input').hide();
        $('.confirm_completion').show();
    });

    function send_score(double_missed, to_finish, score_value){
        $.post(
            // Various errors that are caught if you enter something wrong.
            validation_url,
            $("#score_input").serialize(),
            function (errors) {
                score_errors = errors;
                if (jQuery.isEmptyObject(score_errors)) {
                    socket.emit('send_score', {score: score_value, hashid: hashid['hashid'],
                        user_id: user_id['id'], double_missed: double_missed, to_finish: to_finish});
                } else {
                    $('#score_error').text(score_errors['score_value'][0]);
                }
                $('input[name=score_value]').val('');
                $('#score_value_sm').val($('#score_value').val());
            });
    }

    function handle_score_input(remaining_score, score_value) {
        // player checkout
        if (remaining_score == score_value) {

            // modal for double misses
            const modal = new Promise(function (resolve) {
                // you cannot miss 3 darts if you check
                $('#double-missed-3').hide();

                // one dart checkout possible
                if ((remaining_score <= 40 && remaining_score % 2 == 0) || remaining_score == 50) {
                    $('#double-missed-2').show();
                } else {
                    $('#double-missed-2').hide();
                }

                // two dart checkout possible (naive)
                if (remaining_score > 110) {
                    $('#double-missed-1').hide();
                } else {
                    $('#double-missed-1').show();
                }
                // missing none is always possible
                $('#double-missed-0').show();

                // if it's clear we do not need to ask (score too high for missed doubles)
                if ( remaining_score > 110 ) {
                    resolve(0);
                } else {
                    $('#double-missed-modal').modal('show');
                    $('#double-missed-modal #double-missed-2').click(function () {
                        resolve(2);
                    });
                    $('#double-missed-modal #double-missed-1').click(function () {
                        resolve(1);
                    });
                    $('#double-missed-modal #double-missed-0').click(function () {
                        resolve(0);
                    });
                }
            }).then(function (val) {
                double_missed = val;

                // modal for darts needed for checkout
                const modal2 = new Promise(function (resolve) {
                    // 3 darts for finishing are always possible
                    $('#to-finish-3').show();

                    // 2 dart finish is only possible at 110 or lower (naive)
                    if (remaining_score > 110) {
                        $('#to-finish-2').hide();
                    } else {
                        $('#to-finish-2').show();
                    }

                    // 1 dart finish only for checkable remaining scores
                    if ((remaining_score <= 40 && remaining_score % 2 == 0) || remaining_score == 50) {
                        $('#to-finish-1').show();
                    } else {
                        $('#to-finish-1').hide();
                    }

                    // no need to ask if it must be a 3-dart checkout
                    if (remaining_score > 110) {
                        resolve(3);
                    } else {
                        $('#darts-to-finish-modal').modal('show');
                        $('#darts-to-finish-modal #to-finish-3').click(function () {
                            resolve(3);
                        });
                        $('#darts-to-finish-modal #to-finish-2').click(function () {
                            resolve(2);
                        });
                        $('#darts-to-finish-modal #to-finish-1').click(function () {
                            resolve(1);
                        });
                    }
                }).then(function (val) {
                    to_finish = val;
                    send_score(double_missed, to_finish, score_value);
                    return false;
                });
            });
        }
        // if remaining score - score_value is higher than 50 there is no way for a double attempt
        else if (remaining_score - score_value > 50) {
            send_score(double_missed, to_finish, score_value);
            return false;
        }
        // maybe a double was missed
        else {
            // modal for double misses
            const modal = new Promise(function (resolve) {
                // you can only miss 3 if you started on a checkout score
                if ((remaining_score <= 40 && remaining_score % 2 == 0) || remaining_score == 50) {
                    $('#double-missed-3').show();
                } else {
                    $('#double-missed-3').hide();
                }

                // if a checkout is reachable with 1 dart --> 2 dart checkout possible (naive)
                if (remaining_score <= 110) {
                    $('#double-missed-2').show();
                } else {
                    $('#double-missed-2').hide();
                }

                // in our case a 1-dart miss is possible
                $('#double-missed-1').show();

                // missing none is always possible
                $('#double-missed-0').show();

                $('#double-missed-modal').modal('show');
                $('#double-missed-modal #double-missed-3').click(function () {
                    resolve(3);
                });
                $('#double-missed-modal #double-missed-2').click(function () {
                    resolve(2);
                });
                $('#double-missed-modal #double-missed-1').click(function () {
                    resolve(1);
                });
                $('#double-missed-modal #double-missed-0').click(function () {
                    resolve(0);
                });

            }).then(function (val) {
                double_missed = val;
                send_score(double_missed, to_finish, score_value);
            });
        }
    }

    // Handler for the score input form.
    var validation_url = $('#validation_url').data();
    var user_id = $('#user_id').data();
    var score_errors = [];
    var double_missed = 0;
    var to_finish = 0;

    $('form#score_input').submit(function(event) {
        $('#score_error').text('');
        var score_value = $('#score_value').val();

        // check for valid input values
        if (score_value <= 180) {
            // player 1 handler
            if (user_id['id'] == p1_id && p1_next_turn) {
                handle_score_input($('#p1_score').text(), score_value)

            }
            // player 2 handler
            else if (user_id['id'] == p2_id && !p1_next_turn) {
                handle_score_input($('#p2_score').text(), score_value)
            }
            return false;
        } else {
            $('#score_value').val('');
            return false;
        }
    });

    // handle key inputs
    $(document).keypress(function(e){
        var keyCode = e.which;

        var score_input = document.getElementById('score_value');
        var score_input_sm = document.getElementById('score_value_sm');


        if (document.activeElement != score_input && document.activeElement != score_input_sm) {
            // 1
            if (keyCode == 49 || keyCode == 97) {
                if ($('#double-missed-1').is(":visible")){
                    $('#double-missed-1').click();
                } else if ($('#to-finish-1').is(":visible")){
                    $('#to-finish-1').click();
                } else if ($('#double-missed-modal').is(":hidden") && $('#darts-to-finish-modal').is(":hidden")){
                    $('.score_value').val($('.score_value').val() + '1');
                }
            }
            // 2
            else if (keyCode == 50 || keyCode == 98) {
                if ($('#double-missed-2').is(":visible")){
                    $('#double-missed-2').click();
                } else if ($('#to-finish-2').is(":visible")){
                    $('#to-finish-2').click();
                } else if ($('#double-missed-modal').is(":hidden") && $('#darts-to-finish-modal').is(":hidden")){
                    $('.score_value').val($('.score_value').val() + '2');
                }
            }
            // 3
            else if (keyCode == 51 || keyCode == 99) {
                if ($('#double-missed-3').is(":visible")){
                    $('#double-missed-3').click();
                } else if ($('#to-finish-3').is(":visible")){
                    $('#to-finish-3').click();
                } else if ($('#double-missed-modal').is(":hidden") && $('#darts-to-finish-modal').is(":hidden")) {
                    $('.score_value').val($('.score_value').val() + '3');
                }
            }
            // 4
            else if ($('#double-missed-modal').is(":hidden") && $('#darts-to-finish-modal').is(":hidden")) {

                if (keyCode == 52 || keyCode == 100)
                {
                    $('.score_value').val($('.score_value').val() + '4');
                }
                // 5
                else if (keyCode == 53 || keyCode == 101) {
                    $('.score_value').val($('.score_value').val() + '5');
                }
                // 6
                else if (keyCode == 54 || keyCode == 102) {
                    $('.score_value').val($('.score_value').val() + '6');
                }
                // 7
                else if (keyCode == 55 || keyCode == 103) {
                    $('.score_value').val($('.score_value').val() + '7');
                }
                // 8
                else if (keyCode == 56 || keyCode == 104) {
                    $('.score_value').val($('.score_value').val() + '8');
                }
                // 9
                else if (keyCode == 57 || keyCode == 105) {
                    $('.score_value').val($('.score_value').val() + '9');
                }
                // 0
                else if (keyCode == 48 || keyCode == 96) {
                    if ($('#double-missed-0').is(":visible")) {
                        $('#double-missed-0').click();
                    } else {
                        $('.score_value').val($('.score_value').val() + '0');
                    }
                }
                else if (keyCode == 13) {
                    $('.score_input').submit();
                }
                else if (keyCode == 8) {
                    $('.score_value').val($('.score_value').val().slice(0, -1));
                }
            }
        }

    });


    // onscreen keyboard functions
    $('.button-1').click(function() {
        $('.score_value').val($('.score_value').val() + '1');
    });
    $('.button-2').click(function() {
        $('.score_value').val($('.score_value').val() + '2');
    });
    $('.button-3').click(function() {
        $('.score_value').val($('.score_value').val() + '3');
    });
    $('.button-4').click(function() {
        $('.score_value').val($('.score_value').val() + '4');
    });
    $('.button-5').click(function() {
        $('.score_value').val($('.score_value').val() + '5');
    });
    $('.button-6').click(function() {
        $('.score_value').val($('.score_value').val() + '6');
    });
    $('.button-7').click(function() {
        $('.score_value').val($('.score_value').val() + '7');
    });
    $('.button-8').click(function() {
        $('.score_value').val($('.score_value').val() + '8');
    });
    $('.button-9').click(function() {
        $('.score_value').val($('.score_value').val() + '9');
    });
    $('.button-0').click(function() {
        $('.score_value').val($('.score_value').val() + '0');
    });
    $('.button-del').click(function() {
        $('.score_value').val('');
    });
    $('.button-conf').click(function() {
        $('.score_input').submit();
    });

    // Toggle keypad
    $('#hide-keypad').click(function() {
        $('.score_input').toggle();
    });

    // Abort game
    $('#abort-game').click(function() {
        $('#abort-game-modal').modal('show');
    });

    $('#abort-confirm').click(function() {
        var hashid = $('#hash_id').data()['hashid'];
        var abort_url = $('#abort_url').data()['url'];
        console.log(abort_url + hashid);
        $.post(abort_url + hashid);
    })

});







