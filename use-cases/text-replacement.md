---
description: '!textrule'
---

# Text replacement

## Introduction

{% hint style="info" %}
 The text rule engine requires discord server admin or server manager permissions to configure
{% endhint %}

Talkbot has a powerful rules based text replacement engine. The engine supports simple search and replace, regular expressions and full SSML tagging functionality. 

You may want to use this engine if you'd like to add rules to correct common mispronunciations of words, enforce language filters or simply have a bit of fun customising your server. 

Before you start you will need to make sure you have administrative or server management permissions on the server you'd like to modify. Other users can use the engine, but can not configure the rules within it.

To get started we use the !textrule command to see the capabilities of the textrule system:

```
!textrule

= Text Replacement Rules =
!textrule add <find> -> <replacement>                      :: Find <find> and replace it with <replacement>
!textrule addregex <find_pattern> -> <replacement_pattern> :: Find <find> and replace it with <replacement> using regular expressions
!textrule list                                             :: List all rules
!textrule del <word|emoji>                                 :: Delete a rule by key
!textrule clearall                                         :: Clear all rules
```

The most important commands above are _list_ and _clearall_. _List_ will show you what rules already exist and _clearall_ will clear all rules from the current server.

It's suggested before starting to clear all your existing rules:

```
!textrule clearall
```

## Examples

#### Change burger to cake

The following text rule will change any text written with 'burger' to 'cake' before it's spoken by the bot:

```
!textrule add burger -> cake
```

To remove this rule type:

```
!textrule del burger
```

#### Censor words

The following text rule builds on the replacement engine to use SSML to beep out an unwanted word in text: 

```
!textrule add burger -> <say-as interpret-as="expletive">burger</say-as>
```

This rule utilises Speech Synthesis Markup Language \(SSML\) which is a way of describing how to synthesize speech from text. The SSML language is very powerful and this example above only touches the surface. Further details for SSML capabilities can be found in the [Google SSML documentation](https://developers.google.com/actions/reference/ssml). 

#### Clap every time a user is mentioned

The following text rule uses SSML to reference an external audio file to play every time the server member _wootosmash_ is mentioned.

```
!textrule add wootosmash -> <audio src="https:\/\/sfx.nullabork.dev\/applause-2.wav" /> wootosmash
```

Note the URL in this case needs to be from a **https** site for this to work correctly.  

#### Repeat words twice 

The follow rule adds a regular expression to repeat the word 'burger' twice whenever it is spoken. Note the different command _addregex._

```
!textrule addregex (burger) -> $1 $1
```

To remove this rule:

```
!textrule del (burger)
```

Regular expressions are powerful language for text matching and replacement. For a tutorial on how to use them go to [regexone](https://regexone.com/) or try out your own regular expressions at [www.regex101.com](www.regex101.com) .

## Copying rules to other servers

See the !import command

## Reference sites

* [regexone](https://regexone.com/) - a tutorial on how to write and understand regular expressions
* [www.regex101.com](www.regex101.com) - for testing and validating regular expressions
* [Google SSML documentation](https://developers.google.com/actions/reference/ssml) - for documentation on how to write rules including Speech Synthesis Markup Language.



