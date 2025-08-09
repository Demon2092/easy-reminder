package com.easy.reminder.plugin

data class ReminderDTO(
    val id: String,
    val intervalMinutes: Long,
    var lastTriggered: Long? = null,
    var active: Boolean = true,
    var label: String? = null,
    var soundUri: String? = null,
    var vibrate: Boolean? = null
)
