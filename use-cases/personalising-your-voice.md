---
description: '!mylang, !mygender, !mypitch, !myspeed, !myvoice, !mytitle'
---

# Personalising your voice

### !mygender

My gender can be used to set your gender. This is used to automatically choose which voice is most appropriate for you. You can override the automatic choice by using !myvoice. 

Example:

```text
!mygender female
```

### !mylang

My lang can be used to set your language. This is used to automatically choose which voice is most appropriate for you. You can override the automatic choice by using !myvoice.

Example:

```text
!mylang au
```

### !myvoice

Explicitly set the voice you'd like to use. This will override the settings set for !mylang and !mygender. For the list of supported voices see [Supported languages](../supported-languages.md).

Example:

```text
!myvoice Isla
```

### !mypitch

Set the pitch you'd like to use, valid values are -20 to +20. 

Example:

```text
!mypitch 20
```

You can also use pitch inline using +++ directive and the --- directive. For example:

```text
Hello +++world // higher
Hello ---world // deeper
```

### !myspeed

Set the speed you'd like to use, valid values are 0.25 to 4.0. The default is 1.0.

Example:

```text
!myspeed 0.25
```

### !mytitle

Set the alternative to the title 'master' you'd like to use. The default is 'master'. Talkbot will refer to you using this title for any command where it would normally use the word 'master'.

Example:

```text
!mytitle BURGERKING
```

### Clearing your settings

You can clear your settings back to defaults with **!defaults**



