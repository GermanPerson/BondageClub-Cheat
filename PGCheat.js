let allowBondage = true;
let existingAssetGroups = [];
let silencedServerOutput = false;
let ungarbleChat = false;

let lockQueue = [];
let bondageQueue = [];

AssetGroup.forEach(element => {
    if((element.Name).includes("Item")) {
        existingAssetGroups.push(element.Name);
    }
});

function tick() {
	
	if(lockQueue.length > 0) {
		let parsedLockEntry = lockQueue[0].split(";;;");
		console.log("Locking " + parsedLockEntry[0] + "with " + parsedLockEntry[1]);
		useLock(parsedLockEntry[0], parsedLockEntry[1]);
		lockQueue.splice(0, 1);
	}

	if(bondageQueue.length > 0) {
		let parsedBondageEntry = bondageQueue[0].split(";;;");
		console.log("Locking " + parsedBondageEntry[0] + "with " + parsedBondageEntry[1]);
		InventoryWear(Player, parsedBondageEntry[0], parsedBondageEntry[1]);
		bondageQueue.splice(0, 1);
	}
}

setInterval(() => {
	tick();
}, 100);

function addLockQueue(AssetName, LockAsset = "IntricatePadlock") {
	lockQueue.push(AssetName + ";;;" + LockAsset);
}

function addBondageQueue(AssetName, AssetGroup) {
	bondageQueue.push(`${AssetName};;;${AssetGroup}`);
}

function sendEmote(content) {
	ServerSend("ChatRoomChat", {"Content": content, "Type": "Emote"});
}

function sendMessage(content) {
	ServerSend("ChatRoomChat", {"Content": content, "Type": "Chat"});
}

// Sends a message to the server
function ServerSend(Message, Data) {
	console.log("SENT: " + Message + " : " + JSON.stringify(Data));
	ServerSocket.emit(Message, Data);
}

/* Large patch section */

function setUpServerLog() {
	ServerSocket.on("ServerMessage", function (data) { if(!silencedServerOutput) { console.log(data)  } });
	ServerSocket.on("ServerInfo", function (data) { if(!silencedServerOutput) { console.log(data)  }; ServerInfo(data) });
	ServerSocket.on("CreationResponse", function (data) { if(!silencedServerOutput) { console.log(data)  }; CreationResponse(data) });
	ServerSocket.on("LoginResponse", function (data) { if(!silencedServerOutput) { console.log(data)  }; LoginResponse(data) });
	ServerSocket.on("disconnect", function (data) { if(!silencedServerOutput) { console.log(data)  }; ServerDisconnect() } );
	ServerSocket.on("ForceDisconnect", function (data) { if(!silencedServerOutput) { console.log(data)  }; ServerDisconnect(data) } );
	ServerSocket.on("ChatRoomSearchResult", function (data) { if(!silencedServerOutput) { console.log(data)  }; ChatSearchResult = data; } );
	ServerSocket.on("ChatRoomSearchResponse", function (data) { if(!silencedServerOutput) { console.log(data)  }; ChatSearchResponse(data); } );
	ServerSocket.on("ChatRoomCreateResponse", function (data) { if(!silencedServerOutput) { console.log(data)  }; ChatCreateResponse(data); } );
	ServerSocket.on("ChatRoomSync", function (data) { if(!silencedServerOutput) { console.log(data)  }; ChatRoomSync(data); } );
	ServerSocket.on("ChatRoomMessage", function (data) { if(!silencedServerOutput) { console.log(data)  }; ChatRoomMessage(data); } );
	ServerSocket.on("ChatRoomAllowItem", function (data) { if(!silencedServerOutput) { console.log(data)  }; ChatRoomAllowItem(data); } );
	ServerSocket.on("PasswordResetResponse", function (data) { if(!silencedServerOutput) { console.log(data)  }; PasswordResetResponse(data); } );
}

// Makes the character wear an item, color can be undefined
function InventoryWear(C, AssetName, AssetGroup, ItemColor, Difficulty) {
	console.log(`
		Target: ${C.Name} (Player? ${C == Player})
		AssetName: ${ AssetName }
		AssetGroup: ${ AssetGroup }
		ItemColor: ${ ItemColor }
		Difficulty: ${ Difficulty }
	`);
	
	if(C !== Player) {
		Difficulty = 1000;
		if(ItemColor !== "Default") {
			ItemColor = "#890017";
		}
	} else {
		if(!allowBondage) {
			return;
		}
		
	}
	for (var A = 0; A < Asset.length; A++)
		if ((Asset[A].Name == AssetName) && (Asset[A].Group.Name == AssetGroup)) {
            if(typeof InventoryExpressionTrigger === 'function') {
                InventoryExpressionTrigger(C, InventoryGet(C, AssetGroup));
            }
            CharacterAppearanceSetItem(C, AssetGroup, Asset[A], ItemColor, Difficulty);

			return;
		}
}

// Patch Mistress Expulsion to never fire
// TODO: Remember to update often
function MainHallRun() {

	// If the player is dressed up while being a club slave, the maid intercepts her
	if ((CurrentCharacter == null) && ManagementIsClubSlave() && LogQuery("BlockChange", "Rule") && !Player.IsNaked() && (MainHallMaid.Dialog != null) && (MainHallMaid.Dialog.length > 0)) {
		MainHallMaid.Stage = "50";
		MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "ClubSlaveMustBeNaked");
		CharacterRelease(MainHallMaid);
		CharacterSetCurrent(MainHallMaid);
		MainHallStartEventTimer = null;
		MainHallNextEventTimer = null;
		return;
	}

	// If the player is a Mistress but her Dominant reputation has fallen
	
	/* PATCHED OUT */
	/*if ((CurrentCharacter == null) && LogQuery("ClubMistress", "Management") && (ReputationGet("Dominant") < 50) && Player.CanTalk() && (MainHallMaid.Dialog != null) && (MainHallMaid.Dialog.length > 0)) {
		CommonSetScreen("Room", "Management");
		CharacterSetCurrent(MainHallMaid);
		CurrentScreen = "MainHall";
		MainHallMaid.Stage = "60";
		MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "MistressExpulsionIntro");
		return;
	}*/

	// Draws the character and main hall buttons
	DrawCharacter(Player, 750, 0, 1);
	
	// Char, Dressing, Exit & Chat
	DrawButton(1645, 25, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
	if (Player.CanChange()) DrawButton(1765, 25, 90, 90, "", "White", "Icons/Dress.png", TextGet("Appearance"));
	DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1645, 145, 90, 90, "", "White", "Icons/Chat.png", TextGet("ChatRooms"));

	// The options below are only available if the player can move
	if (Player.CanWalk()) {

		// Shop & Private Room
		DrawButton(1765, 145, 90, 90, "", "White", "Icons/Shop.png", TextGet("Shop"));
		if (!LogQuery("LockOutOfPrivateRoom", "Rule")) DrawButton(1885, 145, 90, 90, "", "White", "Icons/Private.png", TextGet("PrivateRoom"));

		// Introduction, Maid & Management
		DrawButton(1645, 265, 90, 90, "", "White", "Icons/Introduction.png", TextGet("IntroductionClass"));
		DrawButton(1765, 265, 90, 90, "", "White", "Icons/Maid.png", TextGet("MaidQuarters"));
		DrawButton(1885, 265, 90, 90, "", "White", "Icons/Management.png", TextGet("ClubManagement"));

		// Kidnap League, Dojo, Explore/Sarah
		DrawButton(1645, 385, 90, 90, "", "White", "Icons/Kidnap.png", TextGet("KidnapLeague"));
		DrawButton(1765, 385, 90, 90, "", "White", "Icons/Dojo.png", TextGet("ShibariDojo"));
		if (SarahRoomAvailable) DrawButton(1885, 385, 90, 90, "", "White", "Icons/Explore.png", TextGet(SarahRoomLabel()));

		// Cell, Slave Market & Look for trouble
		DrawButton(1645, 505, 90, 90, "", "White", "Icons/Question.png", TextGet("LookForTrouble"));
		DrawButton(1765, 505, 90, 90, "", "White", "Icons/Gavel.png", TextGet("SlaveMarket"));
		DrawButton(1885, 505, 90, 90, "", "White", "Icons/Cell.png", TextGet("Cell"));

		// Draws the custom content rooms - Gambling, Prison & Photographic
		DrawButton(265, 25, 90, 90, "", "White", "Icons/Camera.png", TextGet("Photographic"));
		DrawButton(145, 25, 90, 90, "", "White", "Icons/Cage.png", TextGet("Prison"));
		DrawButton(25, 25, 90, 90, "", "White", "Icons/Random.png", TextGet("Gambling"));

		// Stable, Magic-Theater & Nursery
		DrawButton(265, 145, 90, 90, "", "White", "Icons/Diaper.png", TextGet("Nursery"));
		DrawButton(145, 145, 90, 90, "", "White", "Icons/Magic.png", TextGet("Magic"));
		DrawButton(25, 145, 90, 90, "", "White", "Icons/Horse.png", TextGet("Stable"));

	}

	// Check if there's a new maid rescue event to trigger
	if ((!Player.CanInteract() || !Player.CanWalk() || !Player.CanTalk())) {
		if (MainHallNextEventTimer == null) {
			MainHallStartEventTimer = CommonTime();
			MainHallNextEventTimer = CommonTime() + 40000 + Math.floor(Math.random() * 40000);
		}
	} else {
		MainHallStartEventTimer = null;
		MainHallNextEventTimer = null;
	}
	
	// If we must send a maid to rescue the player
	if ((MainHallNextEventTimer != null) && (CommonTime() >= MainHallNextEventTimer)) {
		MainHallMaid.Stage = "0";
		CharacterRelease(MainHallMaid);
		CharacterSetCurrent(MainHallMaid);
		MainHallStartEventTimer = null;
		MainHallNextEventTimer = null;
	}
	
	// If we must show a progress bar for the rescue maid.  If not, we show the number of online players
	if ((!Player.CanInteract() || !Player.CanWalk() || !Player.CanTalk()) && (MainHallStartEventTimer != null) && (MainHallNextEventTimer != null)) {
		DrawText(TextGet("RescueIsComing"), 1750, 925, "White", "Black");
		DrawProgressBar(1525, 955, 450, 35, (1 - ((MainHallNextEventTimer - CommonTime()) / (MainHallNextEventTimer - MainHallStartEventTimer))) * 100);
	} else DrawText(TextGet("OnlinePlayers") + " " + CurrentOnlinePlayers.toString(), 1750, 960, "White", "Black");

}

/* Outfit Section */

function useLock(AssetName, LockAsset = "IntricatePadlock") {
	Player.Appearance.forEach(item => {
		let i = 0;
		if(item.Asset.Name === AssetName) {
			var newItem = {
				...item, 
				"Property": {
					"Effect": [
						"Lock"
					],
					"LockMemberNumber": 1537,
					"LockedBy": LockAsset
				}
			};

			Player.Appearance[i] = newItem;
		}
		i++;
	});
}


function wearStraitjacket(lock = false) {
	untieCompletely();
	silenceServer();
	InventoryWear(Player, "StraitLeotard", "ItemArms", "#ff6600", 20);
	InventoryWear(Player, "LeatherBlindfold", "ItemHead", "#ff6600", 20);
	InventoryWear(Player, "HarnessBallGag", "ItemMouth", "#202020", 20);
	InventoryWear(Player, "ItemLegs", "LeatherBelt", "#ff6600", 20);

	if(lock) {
		console.log("Applying locks in 250ms...")
		setTimeout(() => {
			//addLockQueue("StraitLeotard");
			//addLockQueue("LeatherBlindfold");
			//addLockQueue("HarnessBallGag");
			//addLockQueue("ItemLegs");
		}, 250);
	}

	CharacterRefresh(Player);
}


function completeSelfBondage() {
	silenceServer();
    existingAssetGroups.forEach(el => {
        InventoryWearRandom(Player, el, 5);
    });
}

/* Utility */

function silenceServer() {
	silencedServerOutput = true;
	setTimeout(() => {
		silencedServerOutput = false;
	}, 1500)
}

/* Bondage removal section */

function untieCompletely() {
	silenceServer();
    existingAssetGroups.forEach(el => {
		if(el === "ItemNeck" || el === "ItemNeckAccessories" || el == "ItemBreast" || el === "ItemVulva") {
			return;
		} else {
			InventoryRemove(Player, el);
		}
    })
}

function removeAllWornItems() {
	silenceServer();
    existingAssetGroups.forEach(el => {
		InventoryRemove(Player, el);
    })
}

function changeLockDuration(minutes) {
	Asset.forEach(e => { if (e.Name == "TimerPadlock") e.RemoveTimer = minutes * 60; });
}

function wearBitchsuitOutfit(lock = false) {
	InventoryWear(Player, "BitchSuit", "ItemArms");
	InventoryWear(Player, "HarnessBallGag", "ItemMouth", "#202020");

	if(lock) {
		console.log("Applying locks in 250ms...")
		setTimeout(() => {
			//addLockQueue("BitchSuit");
			//addLockQueue("HarnessBallGag");
		}, 250);
	}
}

function wearDollOutfit() {
	addBondageQueue("WiffleGag", "ItemMouth");
	addBondageQueue("LeatherHoodOpenMouth", "ItemHead");
	addBondageQueue("LeatherHarness", "ItemTorso");
	addBondageQueue("SteelPostureCollar", "ItemNeck");
	addBondageQueue("CollarChainLong", "ItemNeckAccessories");
	addBondageQueue("LeatherBelt", "ItemLegs");
	addBondageQueue("Irish8Cuffs", "ItemFeet");
	addBondageQueue("LeatherArmbinder", "ItemArms");
	addBondageQueue("PaddedMittens", "ItemHands");

	addLockQueue("LeatherArmbinder");
	addLockQueue("WiffleGag");
	addLockQueue("LeatherHoodOpenMouth");
	addLockQueue("LeatherHarness");
	addLockQueue("SteelPostureCollar");
	addLockQueue("CollarChainLong");
	addLockQueue("LeatherBelt");
	addLockQueue("Irish8Cuffs");
	addLockQueue("PaddedMittens");
}

/* Web Dashboard */

let dashboard = window.open();

dashboard.document.write(`
<html>
<head>
	<title>PGCheat</title>
	<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.bundle.min.js" integrity="sha384-xrRywqdh3PHs8keKZN+8zzc5TX0GRTLCcmivcbNJWm2rs5C8PRhcEn3czEjhAO9o" crossorigin="anonymous"></script>
	<link href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
</head>
<body>
	<div style="text-align: center">
		<h1>PGCheat</h1>
		<hr />
		<h3>Outfits:</h3>
		<button class="btn btn-success" onclick="dashboardStraitjacket()">Straitjacket Outfit</button>
		<br /><br />
		<button class="btn btn-success" onclick="dashboardBitchsuit()" >Bitchsuit Outfit</button>
		<br /><br />
		<label for="outfitLocks">With locks? (WIP)</label>
		<input type="checkbox" id="outfitLocks" />
		<hr />
		<h3>Utility:</h3>
		<button class="btn btn-success" onclick="dashboardUntie()">Remove all restraints (no collars / no chastity)</button>
		<br /><br />
		<button class="btn btn-danger" onclick="dashboardRemoveAllWornItems()">Remove all worn items (will probably break stuff, load an outfit from wardrobe to fix)</button>
	</div>
	<script>
		function dashboardStraitjacket() {
			let locks = document.getElementById("outfitLocks").checked;
			window.opener.wearStraitjacket(locks);
		}

		function dashboardBitchsuit() {
			let locks = document.getElementById("outfitLocks").checked;
			window.opener.wearBitchsuitOutfit(locks);
		}

		function dashboardUntie() {
			window.opener.untieCompletely();
		}

		function dashboardRemoveAllWornItems() {
			window.opener.removeAllWornItems();
		}
	</script>
</body>
</html>
`);
