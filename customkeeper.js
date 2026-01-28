var dbName = "cn.db";
var userSelection = {};

function onJoin(userobj) {
    if (userobj.customName == "") {
        var savedName = getLastUsedCustomName(userobj.name);
        if (savedName) {
            userobj.customName = savedName;
        }
    } else {
        saveCustomNameToWardrobe(userobj.name, userobj.customName);
    }
}

function onBotPM(userobj, text) {
    // Menú simplificado - solo acepta letras para selección
    if (userMenus[userobj.name]) {
        var menu = userMenus[userobj.name];
        var input = text.toLowerCase().trim();
        
        // Solo aceptar letras durante menú
        if (input.length == 1 && /[a-z]/.test(input)) {
            var letterIndex = input.charCodeAt(0) - 97; // 'a' = 0
            
            if (letterIndex >= 0 && letterIndex < menu.names.length && letterIndex < 26) {
                if (menu.type == "ropas" || menu.type == "nicks") {
                    // Seleccionar ropa/nick
                    var selectedName = menu.names[letterIndex].name;
                    userobj.customName = selectedName;
                    saveCustomNameToWardrobe(userobj.name, selectedName);
                    sendPM(userobj, Room.botName, "✓ Cambiado a: " + selectedName);
                    
                } else if (menu.type == "borrar") {
                    // BORRAR ropa/nick
                    var nameToDelete = menu.names[letterIndex].name;
                    
                    if (deleteCustomName(userobj.name, nameToDelete)) {
                        sendPM(userobj, Room.botName, "✓ Eliminado: " + nameToDelete);
                        
                        // Si borró el nombre activo, limpiarlo
                        if (userobj.customName == nameToDelete) {
                            userobj.customName = "";
                            sendPM(userobj, Room.botName, "→ Tu nombre activo ha sido eliminado");
                            
                            // Verificar si era el último nombre
                            var remainingNames = getUserCustomNames(userobj.name);
                            if (remainingNames.length > 0) {
                                // Asignar automáticamente el siguiente (o anterior) disponible
                                userobj.customName = remainingNames[0].name;
                                saveCustomNameToWardrobe(userobj.name, userobj.customName);
                                sendPM(userobj, Room.botName, "→ Automáticamente cambiado a: " + userobj.customName);
                            }
                        }
                    } else {
                        sendPM(userobj, Room.botName, "✗ Error al eliminar");
                    }
                }
                delete userMenus[userobj.name];
                return "";
            }
        }
        delete userMenus[userobj.name];
    }
    
    // Guardar nombre automáticamente
    if (userobj.customName != "") {
        saveCustomNameToWardrobe(userobj.name, userobj.customName);
    }
    
    return text;
}

// Funciones de base de datos (sin cambios)
function getLastUsedCustomName(username) {
    var queryString = "SELECT display_name FROM custom_names WHERE username = {0} ORDER BY last_used DESC LIMIT 1";
    var query = new Query(queryString, username);
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        sql.query(query);
        if (sql.read) {
            var result = sql.value("display_name");
            sql.close();
            return result;
        }
        sql.close();
    }
    return null;
}

function saveCustomNameToWardrobe(username, displayName) {
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        var checkQuery = new Query("SELECT custom_name_id FROM custom_names WHERE username = {0} AND display_name = {1}", username, displayName);
        sql.query(checkQuery);
        
        if (sql.read) {
            var updateQuery = new Query("UPDATE custom_names SET last_used = CURRENT_TIMESTAMP WHERE username = {0} AND display_name = {1}", username, displayName);
            sql.query(updateQuery);
        } else {
            var insertQuery = new Query("INSERT INTO custom_names (username, display_name, last_used) VALUES ({0}, {1}, CURRENT_TIMESTAMP)", username, displayName);
            sql.query(insertQuery);
        }
        sql.close();
        return true;
    }
    return false;
}

function deleteCustomName(username, displayName) {
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        var deleteQuery = new Query("DELETE FROM custom_names WHERE username = {0} AND display_name = {1}", username, displayName);
        sql.query(deleteQuery);
        sql.close();
        return true;
    }
    return false;
}

function getUserCustomNames(username) {
    var names = [];
    var queryString = "SELECT display_name, last_used FROM custom_names WHERE username = {0} ORDER BY last_used DESC";
    var query = new Query(queryString, username);
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        sql.query(query);
        while (sql.read) {
            names.push({
                name: sql.value("display_name"),
                lastUsed: sql.value("last_used")
            });
        }
        sql.close();
    }
    return names;
}

var userMenus = {};

// COMANDOS SIMPLIFICADOS
function onCommand(userobj, command, tUser, args) {
    if (command == "ropas" || command == "nicks") {
        showNamesMenu(userobj, command);
        return true;
    }
    
    if (command == "borrar") {
        showBorrarMenu(userobj);
        return true;
    }
    
    if (command == "nextc") {
        nextCustomName(userobj);
        return true;
    }
    
    if (command == "prevc") {
        prevCustomName(userobj);
        return true;
    }
    
    return false;
}

// 1. COMANDO "ropas" o "nicks" - Ver nombres guardados
function showNamesMenu(userobj, command) {
    var names = getUserCustomNames(userobj.name);
    var menuType = (command == "nicks") ? "nicks" : "ropas";
    
    if (names.length > 0) {
        var title = (menuType == "nicks") ? "═════ Tus Nicks ═════" : "═════ Tus Ropas ═════";
        sendPM(userobj, Room.botName, title);
        
        var letters = "abcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < names.length && i < 10; i++) { // Limitado a 10
            var letter = letters.charAt(i);
            var nameEntry = "[" + letter + "] " + names[i].name;
            
            // Marcar el activo
            if (names[i].name == userobj.customName) {
                nameEntry += " ✓";
            }
            sendPM(userobj, Room.botName, nameEntry);
        }
        
        sendPM(userobj, Room.botName, "══════════════════════");
        sendPM(userobj, Room.botName, "Escribe la letra para usar ese " + ((menuType == "nicks") ? "nick" : "ropa"));
        sendPM(userobj, Room.botName, "/nextc - Siguiente  /prevc - Anterior");
        
        userMenus[userobj.name] = {
            type: menuType,
            names: names
        };
        
    } else {
        sendPM(userobj, Room.botName, "No tienes " + ((menuType == "nicks") ? "nicks" : "ropas") + " guardados.");
    }
}

// 2. COMANDO "borrar" - Eliminar nombres (CORREGIDO)
function showBorrarMenu(userobj) {
    var names = getUserCustomNames(userobj.name);
    if (names.length > 0) {
        sendPM(userobj, Room.botName, "═══ Borrar Nombres ═══");
        
        var letters = "abcdefghijklmnopqrstuvwxyz";
        for (var i = 0; i < names.length && i < 10; i++) {
            var letter = letters.charAt(i);
            var nameEntry = "[" + letter + "] " + names[i].name;
            
            if (names[i].name == userobj.customName) {
                nameEntry += " (Activo)";
            }
            sendPM(userobj, Room.botName, nameEntry);
        }
        
        // Advertencia especial si solo queda uno
        if (names.length == 1) {
            sendPM(userobj, Room.botName, "⚠️ Este es tu ÚLTIMO nombre guardado");
            sendPM(userobj, Room.botName, "Si lo eliminas, tu lista quedará vacía");
        }
        
        sendPM(userobj, Room.botName, "═════════════════════");
        sendPM(userobj, Room.botName, "Escribe la letra para BORRAR ese nombre");
        
        userMenus[userobj.name] = {
            type: "borrar",
            names: names
        };
        
    } else {
        sendPM(userobj, Room.botName, "No tienes nombres para borrar.");
    }
}

// 3. COMANDO "nextc" - Siguiente nombre
function nextCustomName(userobj) {
    var names = getUserCustomNames(userobj.name);
    if (names.length == 0) {
        sendPM(userobj, Room.botName, "No tienes nombres guardados.");
        return;
    }
    
    var currentName = userobj.customName;
    var currentIndex = -1;
    
    // Buscar índice actual
    for (var i = 0; i < names.length; i++) {
        if (names[i].name == currentName) {
            currentIndex = i;
            break;
        }
    }
    
    // Si no se encuentra o es la última, usar la primera
    if (currentIndex == -1 || currentIndex >= names.length - 1) {
        var nextName = names[0].name;
    } else {
        var nextName = names[currentIndex + 1].name;
    }
    
    userobj.customName = nextName;
    saveCustomNameToWardrobe(userobj.name, nextName);
    sendPM(userobj, Room.botName, "✓ Nombre cambiado: " + nextName);
}

// 4. COMANDO "prevc" - Nombre anterior
function prevCustomName(userobj) {
    var names = getUserCustomNames(userobj.name);
    if (names.length == 0) {
        sendPM(userobj, Room.botName, "No tienes nombres guardados.");
        return;
    }
    
    var currentName = userobj.customName;
    var currentIndex = -1;
    
    // Buscar índice actual
    for (var i = 0; i < names.length; i++) {
        if (names[i].name == currentName) {
            currentIndex = i;
            break;
        }
    }
    
    // Si no se encuentra o es la primera, usar la última
    if (currentIndex == -1 || currentIndex == 0) {
        var prevName = names[names.length - 1].name;
    } else {
        var prevName = names[currentIndex - 1].name;
    }
    
    userobj.customName = prevName;
    saveCustomNameToWardrobe(userobj.name, prevName);
    sendPM(userobj, Room.botName, "✓ Nombre cambiado: " + prevName);
}

// Inicializar base de datos
function initDatabase() {
    var queryString = "CREATE TABLE IF NOT EXISTS custom_names (custom_name_id INTEGER PRIMARY KEY AUTOINCREMENT, username NVARCHAR(255) NOT NULL, display_name NVARCHAR(255) NOT NULL, last_used DATETIME DEFAULT CURRENT_TIMESTAMP, created_date DATETIME DEFAULT CURRENT_TIMESTAMP)";
    var query = new Query(queryString);
    
    var sql = new Sql();
    sql.open(dbName);
    
    if (sql.connected) {
        sql.query(query);
        sql.close();
        print("Sistema de Nombres inicializado");
        return true;
    } else {
        print("Error al conectar con la base de datos");
    }
    return false;
}

// Inicializar al cargar
initDatabase();
